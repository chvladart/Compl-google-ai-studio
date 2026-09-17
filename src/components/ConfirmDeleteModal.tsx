import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { SpecificationItem } from '../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  item: SpecificationItem | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  item,
  onConfirm,
  onCancel,
  isDarkMode = true,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all scale-100 ${
          isDarkMode
            ? 'bg-[#111726] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDarkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="space-y-1 pr-6">
            <h3 id="delete-dialog-title" className="text-lg font-bold">
              Удалить позицию?
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Это действие навсегда удалит элемент из текущей ведомости комплектации.
            </p>
          </div>
        </div>

        {/* Item Summary Card */}
        <div
          className={`mt-4 p-3.5 rounded-xl border flex items-center gap-3 ${
            isDarkMode
              ? 'bg-[#0d1320] border-slate-800/80'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          {item.mainPhoto ? (
            <img
              src={item.mainPhoto}
              alt=""
              className="w-12 h-12 rounded-lg object-cover border border-slate-700/50 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] shrink-0 font-mono">
              {item.code}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-bold text-[10px]">
                {item.code}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {item.roomName} &bull; {item.category}
              </span>
            </div>
            <div className="font-bold text-xs truncate">
              {item.name}
            </div>
            {item.brand && (
              <div className="text-[11px] text-slate-400 truncate">
                {item.brand} {item.article ? `(Арт: ${item.article})` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Warning hint */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-500/90 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Все привязанные фото, ссылки и отметки статуса будут удалены.</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-md shadow-rose-900/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Удалить позицию</span>
          </button>
        </div>
      </div>
    </div>
  );
};
