import React, { useState, useEffect } from 'react';
import { LogIn, Mail, Lock, ShieldCheck, X, UserPlus, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { adminLogin, memberLogin, requestProjectAccess } from '../utils/auth';
import { UserRole } from '../types';

interface LoginScreenProps {
  projectId?: string | null;
  onLoginSuccess: (user: { email: string; role: UserRole; isAdmin: boolean; projectId?: string }) => void;
  isDarkMode: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ projectId, onLoginSuccess, isDarkMode }) => {
  const [mode, setMode] = useState<'project' | 'admin'>(projectId ? 'project' : 'admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [projectName, setProjectName] = useState('');
  const [accessState, setAccessState] = useState<'idle' | 'requesting' | 'requested'>('idle');

  // Fetch project name if projectId is provided
  useEffect(() => {
    if (projectId) {
      fetch(`/api/projects/${projectId}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.project) setProjectName(data.project.name);
        })
        .catch(() => {});
    }
  }, [projectId]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await adminLogin(email.trim(), password.trim());
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.error || 'Ошибка входа');
      }
    } catch {
      setErrorMsg('Ошибка сети. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !projectId) return;
    setIsLoading(true);
    setErrorMsg('');
    setAccessState('idle');
    try {
      const result = await memberLogin(email.trim(), projectId);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else if (result.error === 'not_member') {
        // Show request access option
        setAccessState('requesting');
      } else {
        setErrorMsg(result.error === 'already_member' ? 'Вы уже участник проекта. Войдите ещё раз.' : result.error || 'Ошибка входа');
      }
    } catch {
      setErrorMsg('Ошибка сети. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!email.trim() || !projectId) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await requestProjectAccess(projectId, email.trim());
      if (result.success) {
        setAccessState('requested');
      } else if (result.error === 'already_requested') {
        setAccessState('requested');
      } else if (result.error === 'already_member') {
        setErrorMsg('Вы уже участник проекта. Войдите по своей почте выше.');
        setAccessState('idle');
      } else {
        setErrorMsg(result.error || 'Ошибка подачи заявки');
      }
    } catch {
      setErrorMsg('Ошибка сети. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-[#0a0e17]' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        {/* Header */}
        <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-slate-800 bg-[#162238]' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-black text-lg shadow-md shadow-amber-500/20">
              C
            </div>
            <div>
              <h2 className="text-lg font-bold">
                COMPL<span className="text-amber-500">SPEC</span> STUDIO
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'admin' ? 'Вход для администратора' : 'Доступ к проекту'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {mode === 'admin' ? (
            <>
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold">Вход администратора</h3>
                <p className="text-xs text-slate-400">Введите email и пароль для управления проектами</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email:</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="admin@studio.kz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none focus:border-amber-500 ${isDarkMode ? 'bg-[#131d31] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Пароль:</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none focus:border-amber-500 ${isDarkMode ? 'bg-[#131d31] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  {isLoading ? 'Вход...' : 'Войти'}
                </button>
              </form>

              {projectId && (
                <button
                  onClick={() => { setMode('project'); setErrorMsg(''); }}
                  className="w-full text-center text-xs text-slate-400 hover:text-amber-400 transition-colors"
                >
                  ← У меня есть ссылка на проект
                </button>
              )}
            </>
          ) : (
            <>
              {/* Project access mode */}
              {projectName && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                  <span className="text-slate-400">Проект:</span> <strong>{projectName}</strong>
                </div>
              )}

              {accessState === 'idle' && (
                <>
                  <div className="text-center space-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
                      <Mail className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold">Доступ к проекту</h3>
                    <p className="text-xs text-slate-400">Введите email, под которым вас добавили в проект</p>
                  </div>

                  <form onSubmit={handleProjectLogin} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Ваш Email:</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="you@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none focus:border-amber-500 ${isDarkMode ? 'bg-[#131d31] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !email.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      {isLoading ? 'Проверка...' : 'Войти в проект'}
                    </button>
                  </form>
                </>
              )}

              {accessState === 'requesting' && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center mx-auto">
                      <UserPlus className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold">Запрос на доступ</h3>
                    <p className="text-xs text-slate-400">
                      Ваш email <strong className="text-slate-200">{email}</strong> ещё не добавлен в проект.
                      Подайте заявку — администратор получит уведомление и подтвердит доступ.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setAccessState('idle')}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 inline mr-1" />
                      Назад
                    </button>
                    <button
                      onClick={handleRequestAccess}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      {isLoading ? 'Отправка...' : 'Подать заявку'}
                    </button>
                  </div>
                </div>
              )}

              {accessState === 'requested' && (
                <div className="space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Заявка отправлена!</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Администратор проекта получит уведомление о вашей заявке.
                      Как только он подтвердит доступ, вы сможете войти по этому же адресу
                      со своей почтой <strong className="text-slate-200">{email}</strong>.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-amber-400">
                    <Clock className="w-4 h-4" />
                    <span>Ожидает подтверждения администратора</span>
                  </div>
                  <button
                    onClick={() => { setAccessState('idle'); setErrorMsg(''); }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    Проверить доступ снова
                  </button>
                </div>
              )}

              <button
                onClick={() => { setMode('admin'); setErrorMsg(''); setAccessState('idle'); }}
                className="w-full text-center text-xs text-slate-400 hover:text-amber-400 transition-colors"
              >
                ← Вход для администратора
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
