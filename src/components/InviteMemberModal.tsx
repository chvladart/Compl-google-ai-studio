import React, { useState } from 'react';
import { Project, UserRole } from '../types';
import {
  UserPlus,
  Users,
  Shield,
  Briefcase,
  UserCheck,
  Mail,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
} from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onInviteMember: (email: string, role: UserRole) => Promise<void>;
  onRemoveMember: (email: string) => Promise<void>;
  onChangeMemberRole?: (email: string, role: UserRole) => Promise<void>;
  currentUserEmail?: string;
  isDarkMode?: boolean;
  pendingRequests?: any[];
  onApproveRequest?: (requestId: string, role: UserRole) => Promise<void>;
  onRejectRequest?: (requestId: string) => Promise<void>;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  project,
  onInviteMember,
  onRemoveMember,
  onChangeMemberRole,
  currentUserEmail,
  isDarkMode = true,
  pendingRequests = [],
  onApproveRequest,
  onRejectRequest,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [updatingMemberEmail, setUpdatingMemberEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const ROLE_CONFIG: Record<
    UserRole,
    {
      title: string;
      badgeText: string;
      description: string;
      icon: any;
      color: string;
      badgeBg: string;
    }
  > = {
    team: {
      title: 'Команда (Редактор)',
      badgeText: 'Команда',
      description: 'Полный доступ: смета, добавление/удаление позиций, скидки, бюджеты, переписка с поставщиком',
      icon: Shield,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    client: {
      title: 'Заказчик (Клиент)',
      badgeText: 'Заказчик',
      description: 'Согласование позиций: статусы «Согласовано», «Внимание», «Требуется замена», комментарии, просмотр цен (₸). Скидки поставщиков скрыты.',
      icon: UserCheck,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    contractor: {
      title: 'Поставщик / Подрядчик',
      badgeText: 'Поставщик',
      description: 'Обновление статусов готовности/доставки («В производстве», «В доставке», «На объекте») и вопросы по позициям. Цены заказчика скрыты.',
      icon: Briefcase,
      color: 'text-sky-400',
      badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await onInviteMember(cleanEmail, role);
      setFeedbackMsg({
        text: `Пользователь ${cleanEmail} добавлен с ролью «${ROLE_CONFIG[role].title}». Отправьте ему ссылку на проект для входа.`,
        type: 'success',
      });
      setEmail('');
    } catch (err: any) {
      setFeedbackMsg({
        text: err.message || 'Ошибка при добавлении участника',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberEmail: string, newRole: UserRole) => {
    if (!onChangeMemberRole) return;
    setUpdatingMemberEmail(memberEmail);
    try {
      await onChangeMemberRole(memberEmail, newRole);
      setFeedbackMsg({
        text: `Роль для ${memberEmail} изменена на «${ROLE_CONFIG[newRole].title}»`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to change member role:', err);
      setFeedbackMsg({
        text: err.message || 'Не удалось изменить роль',
        type: 'error',
      });
    } finally {
      setUpdatingMemberEmail(null);
    }
  };

  const members = project.members || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden ${
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
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Управление доступом и ролями
              </h2>
              <p className="text-xs text-slate-400">
                Проект: <strong className="text-slate-200">{project.name}</strong>
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

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* How it works info card */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isDarkMode
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block mb-1 font-bold">Принцип работы доступа по Email:</strong>
              Внесите email пользователя в форму ниже и укажите его роль. Отправьте пользователю ссылку на проект — он введёт свою почту и получит доступ. Если человек зайдёт по ссылке без добавления, он сможет подать заявку, которую вы увидите здесь.
            </div>
          </div>

          {/* Section 1: Add Member By Email Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-amber-400" />
                Добавить пользователя по Email
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Укажите адрес почты Google-аккаунта и назначьте роль для работы с проектом.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="ivan@gmail.com или client@mail.kz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs border focus:outline-none focus:border-amber-500 ${
                      isDarkMode ? 'bg-[#131d31] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs font-medium border focus:outline-none focus:border-amber-500 ${
                      isDarkMode ? 'bg-[#131d31] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="client">Заказчик (Клиент)</option>
                    <option value="contractor">Поставщик / Подрядчик</option>
                    <option value="team">Команда (Редактор)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !email.trim()}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {isSubmitting ? '...' : 'Добавить'}
                  </button>
                </div>
              </div>

              {/* Role explanation preview */}
              <div
                className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                  isDarkMode ? 'bg-[#131d31] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ROLE_CONFIG[role].badgeBg}`}>
                  {ROLE_CONFIG[role].badgeText}
                </span>
                <span>{ROLE_CONFIG[role].description}</span>
              </div>
            </form>
          </div>

          {/* Section 1b: Pending Access Requests */}
          {pendingRequests.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Clock className="w-4 h-4 text-sky-400" />
                Заявки на доступ ({pendingRequests.length})
              </div>
              <p className="text-[11px] text-slate-400 -mt-1">
                Эти пользователи хотят получить доступ к проекту. Подтвердите и назначьте роль.
              </p>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap ${
                      isDarkMode ? 'bg-sky-500/5 border-sky-500/20' : 'bg-sky-50 border-sky-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-sky-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                        {req.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate text-slate-200 font-mono">{req.email}</div>
                        <p className="text-[11px] text-slate-400">
                          Заявка: {new Date(req.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        defaultValue="client"
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border cursor-pointer focus:outline-none ${
                          isDarkMode
                            ? 'bg-[#131d31] border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="client">Заказчик</option>
                        <option value="contractor">Поставщик</option>
                      </select>
                      <button
                        type="button"
                        onClick={(e) => {
                          const select = (e.target as HTMLElement).closest('div')?.querySelector('select') as HTMLSelectElement;
                          const role = (select?.value || 'client') as UserRole;
                          onApproveRequest?.(req.id, role);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                        Одобрить
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectRequest?.(req.id)}
                        className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Отклонить заявку"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Members List */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Users className="w-4 h-4 text-amber-500" />
                  Участники проекта ({members.length + 1})
                </div>
                <p className="text-[11px] text-slate-400">
                  Вы можете изменить роль любого пользователя в 1 клик или отозвать доступ.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Project Owner / Admin */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-[#131d31] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow">
                    {(project.ownerEmail || 'В')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-slate-100">{project.ownerEmail || 'wl.chvlad@gmail.com'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                        Владелец / Администратор
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Полный доступ ко всей базе данных, смете и управлению правами
                    </p>
                  </div>
                </div>
              </div>

              {/* Members List */}
              {members.map((member) => {
                const conf = ROLE_CONFIG[member.role] || ROLE_CONFIG.client;
                const isUpdating = updatingMemberEmail === member.email;

                return (
                  <div
                    key={member.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap ${
                      isDarkMode ? 'bg-[#131d31] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          member.role === 'team'
                            ? 'bg-amber-500 text-slate-950'
                            : member.role === 'contractor'
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {(member.name || member.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate text-slate-200 flex items-center gap-2">
                          <span className="font-mono text-slate-100">{member.email}</span>
                          {member.name && <span className="text-slate-400 font-normal">({member.name})</span>}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {isUpdating ? (
                            <span className="text-amber-400 font-medium">Обновление роли...</span>
                          ) : (
                            `Добавлен: ${new Date(member.invitedAt).toLocaleDateString('ru-RU')}`
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Interactive Role Switcher in 1 click */}
                      {onChangeMemberRole ? (
                        <select
                          value={member.role}
                          disabled={isUpdating}
                          onChange={(e) => handleRoleChange(member.email, e.target.value as UserRole)}
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 ${conf.badgeBg}`}
                          title="Изменить роль пользователя"
                        >
                          <option value="client" className="bg-slate-900 text-white">
                            Заказчик (Клиент)
                          </option>
                          <option value="contractor" className="bg-slate-900 text-white">
                            Поставщик / Подрядчик
                          </option>
                          <option value="team" className="bg-slate-900 text-white">
                            Команда (Редактор)
                          </option>
                        </select>
                      ) : (
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${conf.badgeBg}`}>
                          {conf.badgeText}
                        </span>
                      )}

                      {/* Remove access */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Отозвать доступ для ${member.email}?`)) {
                            onRemoveMember(member.email);
                          }
                        }}
                        title="Отозвать доступ"
                        className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {members.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  В проекте пока только администратор. Введите email заказчика или поставщика выше, чтобы предоставить доступ.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
