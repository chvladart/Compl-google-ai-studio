import React, { useState, useEffect } from 'react';
import { Project, SpecificationItem, GoogleDriveBackupFile } from '../types';
import {
  getOrCreateComplspecFolder,
  uploadFileToDrive,
  listDriveBackups,
  downloadDriveBackup,
  syncProjectJsonToDrive,
} from '../utils/googleDrive';
import { exportSpecificationToExcel } from '../utils/exportExcel';
import { exportSpecificationToPdf } from '../utils/exportPdf';
import {
  Cloud,
  HardDrive,
  Check,
  AlertCircle,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  ExternalLink,
  Download,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  items: SpecificationItem[];
  accessToken: string | null;
  currentUserEmail?: string;
  onLoginGoogle: () => Promise<void>;
  onRestoreFromBackup?: (project: Project, items: SpecificationItem[]) => void;
  isDarkMode?: boolean;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  project,
  items,
  accessToken,
  currentUserEmail,
  onLoginGoogle,
  onRestoreFromBackup,
  isDarkMode = true,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [backups, setBackups] = useState<GoogleDriveBackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadBackups();
    }
  }, [isOpen, accessToken]);

  const loadBackups = async () => {
    if (!accessToken) return;
    setIsLoadingBackups(true);
    try {
      const fId = await getOrCreateComplspecFolder(accessToken);
      setFolderId(fId);
      const files = await listDriveBackups(accessToken, fId);
      setBackups(files);
    } catch (err: any) {
      console.warn('Failed to load drive backups:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  if (!isOpen) return null;

  const handleSyncJson = async () => {
    if (!accessToken) {
      await onLoginGoogle();
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Сохранение спецификации на Google Диск...');
    try {
      const result = await syncProjectJsonToDrive(accessToken, project, items);
      setSyncStatusMsg(`Успешно сохранено: "${result.file.name}"`);
      await loadBackups();
    } catch (err: any) {
      setSyncStatusMsg(`Ошибка: ${err.message || 'Не удалось синхронизировать'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUploadExcel = async () => {
    if (!accessToken) {
      await onLoginGoogle();
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Генерация Excel ведомости в тенге (₸)...');
    try {
      const fId = folderId || (await getOrCreateComplspecFolder(accessToken));
      const excelBlob = await exportSpecificationToExcel(project, items, (msg) => setSyncStatusMsg(msg));
      
      setSyncStatusMsg('Загрузка Excel файла на Google Диск...');
      const fileName = `${project.name.replace(/[/\\?%*:|"<>]/g, '_')} - Ведомость комплектации.xlsx`;
      
      await uploadFileToDrive(
        accessToken,
        fId,
        fileName,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        excelBlob
      );

      setSyncStatusMsg(`Excel ведомость успешно загружена на Google Диск!`);
      await loadBackups();
    } catch (err: any) {
      setSyncStatusMsg(`Ошибка выгрузки Excel: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUploadPdf = async () => {
    if (!accessToken) {
      await onLoginGoogle();
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Генерация альбома комплектации PDF...');
    try {
      const fId = folderId || (await getOrCreateComplspecFolder(accessToken));
      const pdfBlob = await exportSpecificationToPdf(project, items, (msg) => setSyncStatusMsg(msg));

      setSyncStatusMsg('Загрузка PDF альбома на Google Диск...');
      const fileName = `${project.name.replace(/[/\\?%*:|"<>]/g, '_')} - Альбом комплектации.pdf`;

      await uploadFileToDrive(accessToken, fId, fileName, 'application/pdf', pdfBlob);

      setSyncStatusMsg(`Альбом PDF успешно загружен на Google Диск!`);
      await loadBackups();
    } catch (err: any) {
      setSyncStatusMsg(`Ошибка выгрузки PDF: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async (file: GoogleDriveBackupFile) => {
    if (!accessToken || !onRestoreFromBackup) return;
    if (!file.name.endsWith('.json')) {
      alert('Восстановить проект можно только из файла резервной копии .json');
      return;
    }

    if (!window.confirm(`Вы действительно хотите восстановить проект из копии "${file.name}"? Текущие данные будут обновлены.`)) {
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Загрузка резервной копии...');
    try {
      const data = await downloadDriveBackup(accessToken, file.id);
      if (data && data.project && Array.isArray(data.items)) {
        onRestoreFromBackup(data.project, data.items);
        setSyncStatusMsg('Проект успешно восстановлен из Google Диска!');
      } else {
        throw new Error('Некорректная структура файла резервной копии');
      }
    } catch (err: any) {
      setSyncStatusMsg(`Ошибка восстановления: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
          isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-[#162238]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Синхронизация с Google Диском</h2>
              <p className="text-xs text-slate-400">
                Резервное копирование и экспорт документов в папку «COMPLSPEC STUDIO»
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Connection status */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              accessToken
                ? isDarkMode
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  accessToken ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                }`}
              >
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-2">
                  {accessToken ? 'Google Диск подключен' : 'Google Диск не подключен'}
                  {accessToken && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-[11px] opacity-80">
                  {currentUserEmail ? `Аккаунт: ${currentUserEmail}` : 'Требуется вход через Google для синхронизации'}
                </div>
              </div>
            </div>

            {!accessToken && (
              <button
                onClick={onLoginGoogle}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-colors"
              >
                Войти через Google
              </button>
            )}
          </div>

          {/* Sync Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Действия синхронизации
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Sync JSON */}
              <button
                onClick={handleSyncJson}
                disabled={isSyncing}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isDarkMode
                    ? 'bg-[#131d31] border-slate-700 hover:border-amber-500 hover:bg-[#162238]'
                    : 'bg-slate-50 border-slate-200 hover:border-amber-400 hover:bg-white'
                } disabled:opacity-50`}
              >
                <div>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 w-fit mb-2">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold">Спецификация JSON</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Полная база проекта (позиции, чертежи, контакты)
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <UploadCloud className="w-3.5 h-3.5" /> Синхронизировать
                </div>
              </button>

              {/* Upload Excel */}
              <button
                onClick={handleUploadExcel}
                disabled={isSyncing}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isDarkMode
                    ? 'bg-[#131d31] border-slate-700 hover:border-emerald-500 hover:bg-[#162238]'
                    : 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:bg-white'
                } disabled:opacity-50`}
              >
                <div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-2">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold">Ведомость Excel (XLSX)</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Таблица с фото, формулами и ценами в ₸
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <UploadCloud className="w-3.5 h-3.5" /> Загрузить на Диск
                </div>
              </button>

              {/* Upload PDF */}
              <button
                onClick={handleUploadPdf}
                disabled={isSyncing}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isDarkMode
                    ? 'bg-[#131d31] border-slate-700 hover:border-rose-500 hover:bg-[#162238]'
                    : 'bg-slate-50 border-slate-200 hover:border-rose-400 hover:bg-white'
                } disabled:opacity-50`}
              >
                <div>
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 w-fit mb-2">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold">Альбом PDF (А4)</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Каталог с карточками, QR и версткой без съездов
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <UploadCloud className="w-3.5 h-3.5" /> Загрузить на Диск
                </div>
              </button>
            </div>

            {/* Status notification */}
            {syncStatusMsg && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-2">
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-400" />
                ) : (
                  <Sparkles className="w-4 h-4 shrink-0 text-blue-400" />
                )}
                {syncStatusMsg}
              </div>
            )}
          </div>

          {/* Files on Google Drive */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Файлы на Google Диске ({backups.length})
              </h3>
              {accessToken && (
                <button
                  onClick={loadBackups}
                  disabled={isLoadingBackups}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  {isLoadingBackups ? 'Обновление...' : 'Обновить список'}
                </button>
              )}
            </div>

            {backups.length > 0 ? (
              <div className="space-y-2">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isDarkMode ? 'bg-[#131d31] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0">
                        {b.name.endsWith('.xlsx') ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        ) : b.name.endsWith('.pdf') ? (
                          <FileText className="w-4 h-4 text-rose-400" />
                        ) : (
                          <FileCode className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{b.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(b.modifiedTime).toLocaleString('ru-RU')} &bull;{' '}
                          {b.size ? `${(Number(b.size) / 1024).toFixed(1)} КБ` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {b.name.endsWith('.json') && onRestoreFromBackup && (
                        <button
                          onClick={() => handleRestore(b)}
                          title="Восстановить проект"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Восстановить
                        </button>
                      )}
                      {b.webViewLink && (
                        <a
                          href={b.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          title="Открыть на Google Диске"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                {accessToken
                  ? 'В папке «COMPLSPEC STUDIO» на Google Диске пока нет сохраненных копий'
                  : 'Подключите Google Диск для просмотра и загрузки резервных копий'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t text-xs flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-[#111928] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          <span>Синхронизация использует официальный Google Drive API</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
