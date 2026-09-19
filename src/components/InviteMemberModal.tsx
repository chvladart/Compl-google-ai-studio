import React, { useState, useEffect } from 'react';
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
  Info,
  Clock,
  Check,
  Share2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  fetchAccessRequests,
  reviewAccessRequest,
} from '../utils/authClient';
import { copyTextToClipboard, getAppBaseUrl } from '../utils/linkUtils';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onInviteMember: (email: string, role: UserRole) => Promise<void>;
  onRemoveMember: (email: string) => Promise<void>;
  onChangeMemberRole?: (email: string, role: UserRole) => Promise<void>;
  currentUserEmail?: string;
  isDarkMode?: boolean;
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
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [updatingMemberEmail, setUpdatingMemberEmail] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Access requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Load access requests
  const loadRequests = async () => {
    if (!project?.id) return;
    setLoadingRequests(true);
    try {
      const data = await fetchAccessRequests(project.id);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load access requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (isOpen && project?.id) {
      loadRequests();
      const interval = setInterval(loadRequests, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen, project?.id]);

  // Sync if project.accessRequests updates via SSE
  useEffect(() => {
    if (project?.accessRequests) {
      setRequests(project.accessRequests);
    }
  }, [project?.accessRequests]);

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

  const shareableUrl = `${getAppBaseUrl()}?project=${encodeURIComponent(project.id)}`;

  const handleCopyLink = async () => {
    const success = await copyTextToClipboard(shareableUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
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
        text: `Пользователь ${cleanEmail} успешно добавлен с ролью «${ROLE_CONFIG[role].title}». Ему достаточно ввести email по ссылке проекта!`,
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

  const handleReviewRequest = async (
    requestId: string,
    action: 'approve' | 'reject',
    assignedRole: UserRole
  ) => {
    setReviewingId(requestId);
    try {
      const result = await reviewAccessRequest(project.id, requestId, action, assignedRole);
      if (result.success) {
        setFeedbackMsg({
          text: action === 'approve' ? 'Заявка одобрена, пользователь добавлен в проект!' : 'Заявка отклонена',
          type: 'success',
        });
        await loadRequests();
      } else {
        setFeedbackMsg({
          text: result.error || 'Не удалось обработать заявку',
          type: 'error',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        text: err.message || 'Ошибка обработки заявки',
        type: 'error',
      });
    } finally {
      setReviewingId(null);
    }
  };

  const members = project.members || [];
  const pendingRequests = requests.filter((r) => r.status === 'pending');

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

        {/* Navigation Tabs */}
        <div
          className={`grid grid-cols-2 border-b text-xs font-bold ${
            isDarkMode ? 'border-slate-800 bg-[#111a2e]' : 'border-slate-200 bg-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-3 px-4 text-center cursor-pointer transition-all flex items-center justify-center gap-2 ${
              activeTab === 'members'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Участники ({members.length + 1})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-4 text-center cursor-pointer transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'requests'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Заявки на доступ</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px] animate-pulse">
                {pendingRequests.length}
              </span>
            )}
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
          {/* TAB 1: Members List & Add form */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Shareable link quick box */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-[#131d31] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Share2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-300 block">
                      Индивидуальная ссылка на этот проект:
                    </span>
                    <span className="text-xs font-mono text-slate-400 truncate block">
                      {shareableUrl}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Скопировано!' : 'Копировать'}</span>
                </button>
              </div>

              {/* Add Member Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-amber-400" />
                    Добавить пользователя по Email
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Укажите email и роль. Пользователь сможет войти по ссылке проекта без пароля.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6 relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="client@gmail.com или partner@mail.kz"
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

                  {/* Role preview */}
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

              {/* Members List */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <Users className="w-4 h-4 text-amber-500" />
                      Участники проекта ({members.length + 1})
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Роль применяется мгновенно при входе пользователя по его email.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {/* Admin / Owner */}
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
                            Администратор (Владелец)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Полный доступ ко всей смете, расчетам и управлению правами
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Other members */}
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
                          {/* Role Switcher */}
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
                      В проекте пока только администратор. Добавьте email заказчика или поставщика выше.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Access Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Заявки от посетителей по ссылке проекта
                  </h3>
                  <p className="text-xs text-slate-400">
                    Одобрите заявку и назначьте роль, чтобы предоставить доступ к смете.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadRequests}
                  className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Обновить
                </button>
              </div>

              {loadingRequests ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Загрузка заявок...
                </div>
              ) : requests.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-400">Нет новых заявок на доступ</p>
                  <p>Когда посетитель запросит доступ по индивидуальной ссылке, заявка появится здесь.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => {
                    const isPending = req.status === 'pending';
                    const isReviewing = reviewingId === req.id;

                    return (
                      <div
                        key={req.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isPending
                            ? 'bg-amber-500/5 border-amber-500/30'
                            : isDarkMode
                            ? 'bg-[#131d31] border-slate-800 opacity-60'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-100">{req.name}</span>
                              <span className="text-xs font-mono text-slate-400">({req.email})</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                                  req.requestedRole === 'contractor'
                                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                Хочет роль: {req.requestedRole === 'contractor' ? 'Поставщик' : 'Заказчик'}
                              </span>
                            </div>

                            {req.message && (
                              <p className="text-xs text-slate-300 italic bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                                «{req.message}»
                              </p>
                            )}

                            <p className="text-[10px] text-slate-500">
                              Дата заявки: {new Date(req.createdAt).toLocaleString('ru-RU')}
                              {req.status !== 'pending' && (
                                <span className="ml-2 font-bold text-slate-400">
                                  • Статус: {req.status === 'approved' ? 'Одобрена' : 'Отклонена'}
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Actions */}
                          {isPending && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={isReviewing}
                                onClick={() => handleReviewRequest(req.id, 'approve', req.requestedRole || 'client')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Одобрить ({req.requestedRole === 'contractor' ? 'Поставщик' : 'Заказчик'})</span>
                              </button>

                              <button
                                type="button"
                                disabled={isReviewing}
                                onClick={() => handleReviewRequest(req.id, 'reject', 'client')}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
                              >
                                Отклонить
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
