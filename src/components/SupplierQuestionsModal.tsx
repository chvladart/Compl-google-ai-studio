import React, { useState } from 'react';
import { SpecificationItem, SupplierQuestion, UserRole, ItemStatus } from '../types';
import { STATUS_CONFIG } from '../utils/formatters';
import {
  MessageSquare,
  Send,
  X,
  ShieldAlert,
  CheckCircle2,
  Clock,
  User,
  Truck,
  Sparkles,
} from 'lucide-react';

interface SupplierQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SpecificationItem | null;
  userRole: UserRole;
  currentUserName: string;
  onAddQuestion: (itemId: string, text: string) => Promise<void>;
  onToggleResolve?: (itemId: string, questionId: string) => Promise<void>;
  onStatusChange?: (itemId: string, status: ItemStatus) => void;
  isDarkMode?: boolean;
}

export const SupplierQuestionsModal: React.FC<SupplierQuestionsModalProps> = ({
  isOpen,
  onClose,
  item,
  userRole,
  currentUserName,
  onAddQuestion,
  onToggleResolve,
  onStatusChange,
  isDarkMode = true,
}) => {
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const questions = item.supplierQuestions || [];
  const unresolvedCount = questions.filter((q) => !q.resolved).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddQuestion(item.id, newText.trim());
      setNewText('');
    } catch (err) {
      console.error('Failed to post question:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
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
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {item.code}
                </span>
                <h2 className="text-base font-bold truncate max-w-md">{item.name}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {item.roomName} &bull; {item.category} {item.brand ? `&bull; ${item.brand}` : ''}
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

        {/* Privacy notice banner */}
        <div className="px-6 py-2.5 bg-sky-950/40 border-b border-sky-800/40 flex items-center gap-2.5 text-xs text-sky-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-sky-400" />
          <span>
            <strong>Конфиденциальный диалог поставщика:</strong> эти вопросы и ответы видны <u>только Команде и Поставщику</u>. Заказчик их не видит.
          </span>
        </div>

        {/* Quick Status Bar for Contractor / Team */}
        {onStatusChange && (
          <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Статус позиции в производстве/доставке:</span>
            </div>
            <select
              value={item.status}
              onChange={(e) => onStatusChange(item.id, e.target.value as ItemStatus)}
              className="text-xs font-bold rounded-lg px-3 py-1.5 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {Object.entries(STATUS_CONFIG).map(([stKey, stMeta]) => (
                <option key={stKey} value={stKey}>
                  {stMeta.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Message Thread */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 min-h-[220px]">
          {questions.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Вопросов по этой позиции пока нет
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {userRole === 'contractor'
                  ? 'Напишите вопрос по чертежу, габаритам, срокам или замене материала — дизайнер получит его моментально.'
                  : 'Поставщик может задавать здесь уточняющие вопросы по производству и доставке.'}
              </p>
            </div>
          ) : (
            questions.map((q) => {
              const isContractor = q.role === 'contractor';
              const isResolved = !!q.resolved;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isResolved
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                      : isContractor
                      ? 'bg-sky-950/20 border-sky-800/40'
                      : 'bg-amber-950/20 border-amber-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isContractor
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {isContractor ? 'П' : 'К'}
                      </div>
                      <span className="text-xs font-bold text-slate-200">{q.author}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          isContractor
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isContractor ? 'Поставщик' : 'Команда / Дизайнер'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(q.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {onToggleResolve && (
                        <button
                          type="button"
                          onClick={() => onToggleResolve(item.id, q.id)}
                          title={isResolved ? 'Отметить нерешенным' : 'Отметить как решено'}
                          className={`p-1 rounded text-xs flex items-center gap-1 transition-colors ${
                            isResolved
                              ? 'text-emerald-400 hover:bg-emerald-500/20'
                              : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${isResolved ? 'text-emerald-400 fill-emerald-400/20' : ''}`} />
                          <span className="text-[10px]">{isResolved ? 'Решено' : 'Закрыть'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed pl-8">
                    {q.text}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                {userRole === 'contractor' ? 'Новый вопрос или уточнение поставщика:' : 'Ответ поставщику от Команды:'}
              </label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={2}
                placeholder={
                  userRole === 'contractor'
                    ? 'Например: "Уточните точный цвет ножек по RAL" или "Нужно согласовать доплату за доставку на 5 этаж"...'
                    : 'Например: "Согласован цвет RAL 9005 матовый, запускайте в производство"...'
                }
                className="w-full rounded-xl px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newText.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 mb-0.5"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Отправка...' : 'Отправить'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
