import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  Briefcase,
  Building2,
  MapPin,
  Maximize2,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { UserRole } from '../types';
import {
  loginAdmin,
  loginMember,
  submitAccessRequest,
  fetchPublicProjectInfo,
} from '../utils/authClient';

interface ProjectAccessGateProps {
  projectId: string;
  onAccessGranted: (user: any, project?: any) => void;
  isDarkMode?: boolean;
}

export const ProjectAccessGate: React.FC<ProjectAccessGateProps> = ({
  projectId,
  onAccessGranted,
  isDarkMode = true,
}) => {
  const [projectInfo, setProjectInfo] = useState<any | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Mode: 'member' (email only), 'request' (request access), 'admin' (email+password)
  const [activeTab, setActiveTab] = useState<'member' | 'request' | 'admin'>('member');

  // Member login state
  const [memberEmail, setMemberEmail] = useState('');
  const [isMemberSubmitting, setIsMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState('');

  // Access request state
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqRole, setReqRole] = useState<'client' | 'contractor'>('client');
  const [reqMessage, setReqMessage] = useState('');
  const [isReqSubmitting, setIsReqSubmitting] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState('');

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('wl.chvlad@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Load public project info
  useEffect(() => {
    let isMounted = true;
    fetchPublicProjectInfo(projectId)
      .then((info) => {
        if (isMounted) {
          setProjectInfo(info);
          setLoadingInfo(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingInfo(false);
      });

    // Check remembered email for this project
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem(`complspec_email_${projectId}`);
      if (savedEmail) {
        setMemberEmail(savedEmail);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Handle Member Login (Email only)
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;

    setIsMemberSubmitting(true);
    setMemberError('');

    const clean = memberEmail.trim().toLowerCase();
    const result = await loginMember(clean, projectId);

    setIsMemberSubmitting(false);

    if (result.success && result.user) {
      onAccessGranted(result.user, result.project);
    } else {
      setMemberError(result.error || 'Email не найден в списке участников проекта');
      setReqEmail(clean);
      if (result.hasPendingRequest) {
        setMemberError('Ваша заявка на доступ к проекту находится на рассмотрении у администратора');
      }
    }
  };

  // Handle Submit Access Request
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqEmail.trim() || !reqName.trim()) return;

    setIsReqSubmitting(true);
    setReqError('');

    const result = await submitAccessRequest(projectId, {
      email: reqEmail.trim().toLowerCase(),
      name: reqName.trim(),
      requestedRole: reqRole,
      message: reqMessage.trim(),
    });

    setIsReqSubmitting(false);

    if (result.success) {
      setReqSuccess(true);
    } else {
      setReqError(result.error || 'Ошибка отправки заявки');
    }
  };

  // Handle Admin Login (Email + Password)
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) return;

    setIsAdminSubmitting(true);
    setAdminError('');

    const result = await loginAdmin(adminEmail.trim(), adminPassword);
    setIsAdminSubmitting(false);

    if (result.success && result.user) {
      onAccessGranted(result.user);
    } else {
      setAdminError(result.error || 'Неверный email или пароль администратора');
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-200 ${
        isDarkMode ? 'bg-[#090d16] text-slate-100' : 'bg-slate-100 text-slate-800'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-lg z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold tracking-wider uppercase shadow-sm">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Индивидуальный доступ к проекту
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            COMPL<span className="text-amber-500">SPEC</span> STUDIO
          </h1>
        </div>

        {/* Project Card Preview */}
        <div
          className={`p-5 rounded-2xl border shadow-xl relative overflow-hidden transition-all ${
            isDarkMode ? 'bg-[#111827]/90 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-500 block">
                Дизайн-проект интерьера
              </span>
              <h2 className="text-base sm:text-lg font-bold truncate text-slate-100">
                {projectInfo?.name || 'Дизайн-проект'}
              </h2>
              {projectInfo?.address && (
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{projectInfo.address}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick specs chips */}
          {projectInfo && (
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-slate-800/80 text-center">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Площадь</span>
                <span className="text-xs font-bold text-slate-200">{projectInfo.area || 0} м²</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Помещений</span>
                <span className="text-xs font-bold text-slate-200">{projectInfo.roomsCount || 0} комнат</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Позиций</span>
                <span className="text-xs font-bold text-slate-200">{projectInfo.itemsCount || 0} в смете</span>
              </div>
            </div>
          )}
        </div>

        {/* Portal Card with Tabs */}
        <div
          className={`rounded-2xl border shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Navigation Bar */}
          <div
            className={`grid grid-cols-2 border-b text-xs font-bold ${
              isDarkMode ? 'border-slate-800 bg-[#0d1320]' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('member');
                setMemberError('');
              }}
              className={`py-3 px-4 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'member'
                  ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Вход по Email</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('request');
                setReqError('');
                setReqSuccess(false);
              }}
              className={`py-3 px-4 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'request'
                  ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Запросить доступ</span>
            </button>
          </div>

          <div className="p-6 sm:p-7">
            {/* TAB 1: Member Login (Email Only, No Password) */}
            {activeTab === 'member' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    Вход для заказчиков и поставщиков
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Пароль не требуется! Просто укажите вашу почту. Если автор добавил вас в проект, спецификация откроется мгновенно с вашей ролью.
                  </p>
                </div>

                {memberError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{memberError}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('request');
                          setReqEmail(memberEmail);
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold underline mt-1.5 inline-flex items-center gap-1"
                      >
                        Запросить доступ у автора проекта <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleMemberSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                      Ваш рабочий Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="client@gmail.com или partner@mail.kz"
                        value={memberEmail}
                        onChange={(e) => {
                          setMemberEmail(e.target.value);
                          if (memberError) setMemberError('');
                        }}
                        className={`w-full rounded-xl pl-4 pr-10 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                          isDarkMode
                            ? 'bg-[#182235] border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isMemberSubmitting || !memberEmail.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isMemberSubmitting ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Войти в проект</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-800 text-center">
                  <p className="text-xs text-slate-400">
                    Еще не получили приглашение?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('request')}
                      className="text-amber-400 hover:text-amber-300 font-bold underline"
                    >
                      Отправить заявку автору
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Access Request (Guest Request Form) */}
            {activeTab === 'request' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    Заявка на доступ к проекту
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Отправьте запрос автору проекта. После одобрения вы сможете войти по указанному адресу почты без пароля.
                  </p>
                </div>

                {reqSuccess ? (
                  <div className="p-5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-center space-y-3 animate-in fade-in">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <div>
                      <h4 className="font-bold text-sm text-emerald-100">Заявка успешно отправлена!</h4>
                      <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
                        Автор проекта <strong>{projectInfo?.name}</strong> уведомлен. Как только он одобрит запрос и назначит роль, откройте эту ссылку и введите <strong>{reqEmail}</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReqSuccess(false);
                        setActiveTab('member');
                        setMemberEmail(reqEmail);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer transition-colors"
                    >
                      Вернуться ко входу
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    {reqError && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                        {reqError}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Ваше имя или организация</label>
                      <input
                        type="text"
                        required
                        placeholder="Например: Азамат Сериков или Poliform"
                        value={reqName}
                        onChange={(e) => setReqName(e.target.value)}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          isDarkMode ? 'bg-[#182235] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Ваш Email для входа</label>
                      <input
                        type="email"
                        required
                        placeholder="client@mail.kz"
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          isDarkMode ? 'bg-[#182235] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Ваша роль в проекте</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setReqRole('client')}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                            reqRole === 'client'
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <UserCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                          <div>
                            <span className="block text-xs font-bold">Заказчик</span>
                            <span className="text-[10px] text-slate-400">Согласование сметы</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReqRole('contractor')}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                            reqRole === 'contractor'
                              ? 'bg-sky-500/15 border-sky-500 text-sky-300 ring-1 ring-sky-500/50'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Briefcase className="w-4 h-4 shrink-0 text-sky-400" />
                          <div>
                            <span className="block text-xs font-bold">Поставщик</span>
                            <span className="text-[10px] text-slate-400">Сроки и статусы</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Комментарий (необязательно)</label>
                      <textarea
                        rows={2}
                        placeholder="Например: Заказчик квартиры №84, хочу согласовать позиции"
                        value={reqMessage}
                        onChange={(e) => setReqMessage(e.target.value)}
                        className={`w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          isDarkMode ? 'bg-[#182235] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isReqSubmitting || !reqEmail.trim() || !reqName.trim()}
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isReqSubmitting ? (
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Отправить запрос автору</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: Admin Studio Login (Email + Password) */}
            {activeTab === 'admin' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Вход администратора дизайн-студии
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Полный доступ к редактированию сметы, финансовым расчетам, скидкам и распределению ролей.
                  </p>
                </div>

                {adminError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    {adminError}
                  </div>
                )}

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Email администратора</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                        isDarkMode ? 'bg-[#182235] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Пароль</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                        isDarkMode ? 'bg-[#182235] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAdminSubmitting || !adminEmail.trim() || !adminPassword.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAdminSubmitting ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Войти как Администратор</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer toggle for Admin switch */}
          <div
            className={`px-6 py-3 border-t text-center text-xs ${
              isDarkMode ? 'border-slate-800 bg-[#0d1320] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {activeTab !== 'admin' ? (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className="text-slate-400 hover:text-amber-400 transition-colors font-medium cursor-pointer"
              >
                Автор или администратор проекта? <span className="underline">Войти с паролем</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('member')}
                className="text-slate-400 hover:text-amber-400 transition-colors font-medium cursor-pointer"
              >
                ← Вернуться ко входу участников
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
