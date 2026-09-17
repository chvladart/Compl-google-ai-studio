import { Project, SpecificationItem, GoogleDriveBackupFile } from '../types';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_NAME = 'COMPLSPEC STUDIO — Проекты';

/**
 * Searches for or creates a dedicated COMPLSPEC folder on the user's Google Drive
 */
export async function getOrCreateComplspecFolder(accessToken: string): Promise<string> {
  // 1. Search for existing folder
  const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`${DRIVE_API_BASE}/files?q=${query}&fields=files(id,name)&spaces=drive`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Ошибка доступа к Google Drive: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Create folder if not found
  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Спецификации и ведомости проектов COMPLSPEC STUDIO',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Не удалось создать папку на Google Диске');
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * Uploads or updates a file on Google Drive
 */
export async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  content: Blob | string
): Promise<GoogleDriveBackupFile> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: mimeType,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  let body: Blob;

  if (typeof content === 'string') {
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelim;

    body = new Blob([multipartRequestBody], { type: `multipart/related; boundary=${boundary}` });
  } else {
    // If Blob
    const metadataBlob = new Blob(
      [
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n\r\n`,
      ],
      { type: 'text/plain' }
    );
    const closeBlob = new Blob([closeDelim], { type: 'text/plain' });
    body = new Blob([metadataBlob, content, closeBlob], {
      type: `multipart/related; boundary=${boundary}`,
    });
  }

  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink,size`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ошибка загрузки на Google Диск: ${errText}`);
  }

  return await res.json();
}

/**
 * Lists backups in the COMPLSPEC folder
 */
export async function listDriveBackups(accessToken: string, folderId: string): Promise<GoogleDriveBackupFile[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(
    `${DRIVE_API_BASE}/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&pageSize=30`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Downloads a backup file from Google Drive
 */
export async function downloadDriveBackup(accessToken: string, fileId: string): Promise<any> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Не удалось скачать файл с Google Диска');
  }

  return await res.json();
}

/**
 * High level sync function: saves project JSON specification to Google Drive
 */
export async function syncProjectJsonToDrive(
  accessToken: string,
  project: Project,
  items: SpecificationItem[]
): Promise<{ file: GoogleDriveBackupFile; folderId: string }> {
  const folderId = await getOrCreateComplspecFolder(accessToken);
  const fileName = `${project.name.replace(/[/\\?%*:|"<>]/g, '_')} - Спецификация [${new Date().toLocaleDateString('ru-RU')}].json`;

  const payload = {
    format: 'complspec-backup-v2',
    timestamp: new Date().toISOString(),
    project,
    items,
  };

  const file = await uploadFileToDrive(
    accessToken,
    folderId,
    fileName,
    'application/json',
    JSON.stringify(payload, null, 2)
  );

  return { file, folderId };
}
