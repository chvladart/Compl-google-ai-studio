import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Project, SpecificationItem } from '../types';
import { calcItemTotal, formatCurrency, STATUS_CONFIG } from './formatters';
import { generateQrDataUrl } from './qrCode';

/**
 * Generates an elegant, high-resolution PDF document for the project specification
 * with pixel-perfect font rendering, no text clipping, and proper Tenge (₸) currency.
 */
export async function exportSpecificationToPdf(
  project: Project,
  items: SpecificationItem[],
  onProgress?: (msg: string) => void
): Promise<Blob> {
  onProgress?.('Подготовка альбома комплектации...');

  // 1. Wait for fonts to be completely ready
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue if fonts check fails
    }
  }

  // 2. Preload all main photos so html2canvas renders them reliably
  onProgress?.('Загрузка изображений...');
  const preloadPromises = items
    .filter((it) => it.mainPhoto)
    .map((it) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = it.mainPhoto!;
      });
    });
  await Promise.all(preloadPromises);

  // 3. Pre-generate QR codes for all items
  onProgress?.('Генерация QR-кодов...');
  const qrCodesMap = new Map<string, string>();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const qrTarget = item.link || `${window.location.origin}/#${item.code}`;
      const qr = await generateQrDataUrl(qrTarget);
      qrCodesMap.set(item.id, qr);
    } catch {
      // ignore individual QR failure
    }
  }

  // 4. Create on-screen invisible container (fixed at 0,0 to prevent negative coordinate glitches in html2canvas)
  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.zIndex = '-9999';
  container.style.opacity = '0.001';
  container.style.pointerEvents = 'none';
  container.style.width = '1122px'; // A4 Landscape at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "Arial, 'Helvetica Neue', Helvetica, 'DejaVu Sans', sans-serif";
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.boxSizing = 'border-box';

  const totalSpent = items.reduce(
    (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
    0
  );
  const totalCount = items.length;
  const inWorkCount = items.filter((it) =>
    ['approved', 'invoice_issued', 'paid_in_production', 'shipping'].includes(it.status)
  ).length;

  const ITEMS_PER_PAGE = 4;
  const pagesCount = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;

  let pagesHtml = '';

  for (let p = 0; p < pagesCount; p++) {
    const pageItems = items.slice(p * ITEMS_PER_PAGE, (p + 1) * ITEMS_PER_PAGE);

    pagesHtml += `
      <div class="pdf-page" style="width: 1122px; height: 793px; min-height: 793px; max-height: 793px; padding: 22px 32px 18px 32px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff; page-break-after: always; position: relative; font-family: Arial, 'Helvetica Neue', Helvetica, 'DejaVu Sans', sans-serif;">
        
        <!-- Header -->
        <div style="width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px;">
            <div style="max-width: 700px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
                <span style="background: #f59e0b; color: #000000; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 4px; display: inline-block;">COMPLSPEC</span>
                <span style="font-size: 12px; font-weight: 700; color: #475569; letter-spacing: 0.5px;">STUDIO &bull; ВЕДОМОСТЬ КОМПЛЕКТАЦИИ</span>
              </div>
              <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 3px 0; line-height: 1.4; padding-top: 3px; padding-bottom: 2px;">${project.name}</h1>
              <div style="font-size: 11px; color: #64748b; line-height: 1.4; padding-bottom: 2px;">
                <span>Клиент: <strong style="color: #1e293b;">${project.client || 'Не указан'}</strong></span>
                <span style="margin: 0 6px;">&bull;</span>
                <span>Адрес: ${project.address || '—'}</span>
                <span style="margin: 0 6px;">&bull;</span>
                <span>Площадь: <strong>${project.area} м²</strong></span>
              </div>
            </div>

            <div style="text-align: right; min-width: 260px;">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 2px;">Освоено бюджета / Лимит</div>
              <div style="font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.35; padding-top: 2px;">
                ${formatCurrency(totalSpent)} <span style="font-size: 11px; font-weight: 500; color: #64748b;">из ${formatCurrency(project.totalBudget)}</span>
              </div>
              <div style="font-size: 11px; color: #16a34a; font-weight: 700; margin-top: 3px;">
                Всего позиций: ${totalCount} (в закупке: ${inWorkCount})
              </div>
            </div>
          </div>

          <!-- Items List (Cards) -->
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            ${pageItems
              .map((item) => {
                const qrUrl = qrCodesMap.get(item.id) || '';
                const totalPos = calcItemTotal(item.basePrice, item.supplierDiscount, item.quantity);
                const st = STATUS_CONFIG[item.status];
                const statusLabel = st ? st.label : item.status;

                return `
                <div style="display: flex; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; height: 146px; min-height: 146px; max-height: 146px; box-sizing: border-box; width: 100%;">
                  
                  <!-- Photo Thumbnail -->
                  <div style="width: 170px; min-width: 170px; max-width: 170px; height: 144px; background: #e2e8f0; position: relative; border-right: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; overflow: hidden; border-top-left-radius: 7px; border-bottom-left-radius: 7px;">
                    ${
                      item.mainPhoto
                        ? `<img src="${item.mainPhoto}" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'" />`
                        : `<span style="color: #94a3b8; font-size: 11px; font-weight: 600;">Нет фото</span>`
                    }
                    <div style="position: absolute; top: 6px; left: 6px; background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); font-family: monospace;">
                      ${item.code}
                    </div>
                  </div>

                  <!-- Details Middle -->
                  <div style="flex: 1; padding: 8px 16px 8px 16px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; min-width: 0;">
                    <div>
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                        <span style="font-size: 10.5px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.3px;">
                          ${item.roomName} &bull; ${item.category}
                        </span>
                        <span style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-size: 10px; font-weight: 700; padding: 1px 8px; border-radius: 8px;">
                          ${statusLabel}
                        </span>
                      </div>
                      
                      <div style="font-size: 13.5px; font-weight: 700; color: #0f172a; line-height: 1.4; padding-top: 3px; padding-bottom: 1px;">
                        ${item.name}
                      </div>
                      
                      <div style="font-size: 11px; color: #475569; margin-top: 1px; line-height: 1.35;">
                        ${item.brand ? `<span style="font-weight: 700; color: #334155;">${item.brand}</span>` : ''}
                        ${item.article ? `<span style="color: #64748b;"> &bull; Арт: ${item.article}</span>` : ''}
                      </div>
                    </div>

                    <div style="font-size: 11px; color: #334155; line-height: 1.4; padding-top: 4px; border-top: 1px solid #e2e8f0;">
                      <div><strong style="color: #1e293b;">Габариты:</strong> ${item.dimensions || '—'}</div>
                      <div style="color: #475569; margin-top: 1px;">
                        <strong style="color: #1e293b;">Отделка:</strong> ${item.finish || '—'}
                      </div>
                      ${
                        item.techNotes
                          ? `<div style="color: #475569; font-style: italic; margin-top: 1px;"><strong style="color: #1e293b; font-style: normal;">ТЗ:</strong> ${item.techNotes}</div>`
                          : ''
                      }
                    </div>
                  </div>

                  <!-- Price & QR Column -->
                  <div style="width: 220px; min-width: 220px; max-width: 220px; padding: 9px 12px 9px 14px; background: #f1f5f9; border-left: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; border-top-right-radius: 7px; border-bottom-right-radius: 7px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        <div style="font-size: 11px; color: #64748b;">
                          Кол-во: <strong style="color: #0f172a;">${item.quantity} ${item.unit}</strong>
                        </div>
                        <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                          Базовая: <strong>${formatCurrency(item.basePrice)}</strong>
                        </div>
                        ${
                          item.supplierDiscount > 0
                            ? `<div style="font-size: 10.5px; color: #16a34a; font-weight: 700; margin-top: 2px;">Скидка: -${item.supplierDiscount}%</div>`
                            : ''
                        }
                      </div>

                      ${
                        qrUrl
                          ? `<div style="text-align: center;">
                              <img src="${qrUrl}" style="width: 54px; height: 54px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; display: block;" alt="QR" />
                              <span style="font-size: 8.5px; color: #94a3b8; display: block; margin-top: 2px; font-weight: 600;">QR-ссылка</span>
                            </div>`
                          : ''
                      }
                    </div>

                    <div style="border-top: 1px dashed #cbd5e1; padding-top: 4px; display: flex; justify-content: space-between; align-items: flex-end;">
                      <span style="font-size: 11px; font-weight: 700; color: #475569;">ИТОГО:</span>
                      <span style="font-size: 15px; font-weight: 800; color: #0f172a; line-height: 1.2;">${formatCurrency(totalPos)}</span>
                    </div>
                  </div>

                </div>
              `;
              })
              .join('')}
          </div>
        </div>

        <!-- Page Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 10px; color: #64748b; width: 100%;">
          <span>COMPLSPEC STUDIO &bull; Спецификация комплектации дизайн-проекта интерьера</span>
          <span style="font-weight: 700; color: #334155;">Страница ${p + 1} из ${pagesCount}</span>
          <span>Экспорт: ${new Date().toLocaleDateString('ru-RU')}</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = pagesHtml;
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1122, 793],
      hotfixes: ['px_scaling'],
    });

    const pageElements = container.querySelectorAll('.pdf-page');

    for (let i = 0; i < pageElements.length; i++) {
      onProgress?.(`Рендеринг страницы ${i + 1} из ${pageElements.length}...`);
      const pageEl = pageElements[i] as HTMLElement;

      try {
        const canvas = await html2canvas(pageEl, {
          scale: 2, // High resolution crisp rendering (2x retina)
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          windowWidth: 1122,
          windowHeight: 793,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage([1122, 793], 'landscape');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 1122, 793, undefined, 'FAST');
      } catch (pageErr) {
        console.warn(`Error rendering page ${i + 1} to canvas:`, pageErr);
      }
    }

    onProgress?.('Сборка PDF файла...');
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
