import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Project } from '../types';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Users,
  ExternalLink,
  X,
  Info,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { copyTextToClipboard, getAppBaseUrl } from '../utils/linkUtils';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onOpenInviteMembers?: () => void;
  isDarkMode?: boolean;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onOpenInviteMembers,
  isDarkMode = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQr, setShowQr] = useState(false);

  // Build the unique individual project link
  const baseUrl = getAppBaseUrl();
  const shareableUrl = `${baseUrl}?project=${encodeURIComponent(project.id)}`;

  useEffect(() => {
    if (isOpen && shareableUrl) {
      QRCode.toDataURL(shareableUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }
  }, [isOpen, shareableUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyTextToClipboard(shareableUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-[#162238]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Индивидуальная ссылка на проект</h2>
              <p className="text-xs text-slate-400 truncate max-w-[280px] sm:max-w-none">
                {project.name}
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
        <div className="p-5 sm:p-6 space-y-5">
          {/* How it works info */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isDarkMode
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block mb-0.5 font-bold">Удобный доступ без паролей:</strong>
              Отправьте эту ссылку заказчику или поставщику. При переходе они вводят свой email и сразу попадают в проект со своей ролью. Если email еще не добавлен, они смогут в 1 клик отправить заявку.
            </div>
          </div>

          {/* Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Ссылка на проект
            </label>
            <div
              className={`flex items-center gap-2 p-2 rounded-xl border ${
                isDarkMode ? 'bg-[#131d31] border-slate-700' : 'bg-slate-50 border-slate-300'
              }`}
            >
              <input
                type="text"
                readOnly
                value={shareableUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-transparent px-2 text-xs font-mono text-slate-200 truncate focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Копировать</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{showQr ? 'Скрыть QR-код' : 'Показать QR-код для телефона'}</span>
            </button>

            {onOpenInviteMembers && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInviteMembers();
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Участники ({project.members?.length || 0})</span>
              </button>
            )}
          </div>

          {/* QR Code Preview */}
          {showQr && qrDataUrl && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-2 animate-in zoom-in-95">
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-44 h-44 mx-auto rounded-lg shadow-sm"
              />
              <p className="text-[11px] text-slate-600 font-medium flex items-center justify-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                Отсканируйте камерой смартфона для быстрого входа
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
