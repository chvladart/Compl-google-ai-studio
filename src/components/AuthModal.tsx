import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  LogIn,
  LogOut,
  Mail,
  User,
  ShieldCheck,
  CheckCircle,
  X,
  Sparkles,
  Database,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onGoogleSignIn: () => Promise<void>;
  onManualSignIn: (email: string, name: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  isDarkMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onGoogleSignIn,
  onManualSignIn,
  onSignOut,
  isDarkMode = true,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка входа через Google. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      await onManualSignIn(email.trim(), name.trim() || email.split('@')[0]);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  const isGuestOrDemo = currentUser.email === 'demo@complspec.kz' || !currentUser.isGoogleUser;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Личный кабинет</h2>
              <p className="text-xs text-slate-400">Авторизация и права доступа к проектам</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Current Profile Card */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isDarkMode ? 'bg-[#131d31] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-amber-500"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base">
                  {currentUser.name[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  {currentUser.name}
                  {currentUser.isGoogleUser && (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="text-xs text-slate-400">{currentUser.email}</div>
                <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                  {currentUser.roleTitle}
                </div>
              </div>
            </div>

            {currentUser.isGoogleUser && (
              <button
                onClick={async () => {
                  await onSignOut();
                  onClose();
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Выйти из аккаунта"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Database Info Callout */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Единая база данных проектов:</strong>
              <div className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                Все участники (дизайнер, заказчик, поставщик) работают в едином общем проекте в реальном времени с автоматическим разграничением прав по роли Google-аккаунта.
              </div>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-sm transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{currentUser.isGoogleUser ? 'Сменить аккаунт Google' : 'Войти через Google'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] text-slate-500 uppercase font-semibold">или по email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Manual Email Login Form */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ваш Email:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="designer@studio.kz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none focus:border-amber-500 ${
                    isDarkMode ? 'bg-[#131d31] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Имя / Студия:</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Айгерим Султанова"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none focus:border-amber-500 ${
                    isDarkMode ? 'bg-[#131d31] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t text-xs flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-[#111928] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          <span>Безопасная авторизация через Firebase + Google</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
