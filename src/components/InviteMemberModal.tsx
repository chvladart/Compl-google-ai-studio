import React, { useState } from 'react';
import { Project, ProjectMember, UserRole } from '../types';
import {
  UserPlus,
  Users,
  Shield,
  Briefcase,
  UserCheck,
  Mail,
  Copy,
  Check,
  Trash2,
  X,
  Send,
  Sparkles,
} from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onInviteMember: (email: string, role: UserRole) => Promise<void>;
  onRemoveMember: (email: string) => Promise<void>;
  currentUserEmail?: string;
  isDarkMode?: boolean;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  project,
  onInviteMember,
  onRemoveMember,
  currentUserEmail,
  isDarkMode = true,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setFeedbackMsg('');
    try {
      await onInviteMember(email.trim().toLowerCase(), role);
      setFeedbackMsg(`Приглашение отправлено на ${email.trim()}`);
      setEmail('');
    } catch (err: any) {
      setFeedbackMsg(err.message || 'Ошибка при отправке приглашения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/?project=${project.id}&role=${role}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const members = project.members || [];

  const ROLE_INFOS: Record<
    UserRole,
    { title: string; subtitle: string; icon: any; color: string; badgeBg: string }
  > = {
    team: {
      title: 'Дизайнер / Комплектатор',
      subtitle: 'Полный доступ: редактирование сметы, поставщиков, скидок, бюджета',
      icon: Shield,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    },
    client: {
      title: 'Заказчик (Клиент)',
      subtitle: 'Согласование позиций, комментарии, просмотр цен со скидкой',
      icon: UserCheck,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    },
    contractor: {
      title: 'Подрядчик / Мастер',
      subtitle: 'Отслеживание сроков, обновление статусов производства и монтажа',
      icon: Briefcase,
      color: 'text-sky-400',
      badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    },
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
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Пригласить в проект</h2>
              <p className="text-xs text-slate-400">
                {project.name} &bull; Совместная работа в реальном времени
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
          {/* Invite Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email участника:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="dana.client@gmail.com или partner@interier.kz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none focus:border-amber-500 ${
                    isDarkMode ? 'bg-[#131d31] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Роль и уровень доступа:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['client', 'team', 'contractor'] as UserRole[]).map((r) => {
                  const info = ROLE_INFOS[r];
                  const Icon = info.icon;
                  const isSelected = role === r;

                  return (
                    <div
                      key={r}
                      onClick={() => setRole(r)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? isDarkMode
                            ? 'bg-[#182641] border-amber-500 ring-1 ring-amber-500/50'
                            : 'bg-amber-50 border-amber-500'
                          : isDarkMode
                          ? 'bg-[#131d31] border-slate-800 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className={`w-4 h-4 ${info.color}`} />
                        <span className="text-xs font-bold">{info.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{info.subtitle}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={copyInviteLink}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Ссылка скопирована!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    Скопировать прямую ссылку
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Отправка...' : 'Отправить приглашение'}
              </button>
            </div>

            {feedbackMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                {feedbackMsg}
              </div>
            )}
          </form>

          {/* Members List */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Users className="w-4 h-4 text-amber-500" />
                Участники проекта ({members.length + 1})
              </div>
            </div>

            <div className="space-y-2">
              {/* Owner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'bg-[#131d31] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                    {(project.ownerEmail || 'В')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      {project.ownerEmail || 'Владелец проекта'}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                        Создатель
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">Полный доступ к проекту</div>
                  </div>
                </div>
              </div>

              {/* Invited Members */}
              {members.map((m) => {
                const info = ROLE_INFOS[m.role] || ROLE_INFOS.team;

                return (
                  <div
                    key={m.id || m.email}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isDarkMode ? 'bg-[#131d31] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs">
                        {m.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-2">
                          {m.name || m.email}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${info.badgeBg}`}
                          >
                            {info.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{m.email}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveMember(m.email)}
                      title="Удалить доступ"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t text-xs flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-[#111928] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          <span>Синхронизация участников сохраняется онлайн</span>
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
