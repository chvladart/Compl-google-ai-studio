import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  LogIn,
  LogOut,
  Mail,
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  KeyRound,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { loginAdmin, loginMember, logoutAuth } from '../utils/authClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  activeProjectId?: string;
  onLoginSuccess: (user: UserProfile) => void;
  onSignOut: () => void;
  isDarkMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeProjectId,
  onLoginSuccess,
  onSignOut,
  isDarkMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'member'>('admin');

  // Admin login fields
  const [adminEmail, setAdminEmail] = useState('wl.chvlad@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Password change
  const [showChangePass, setShowChangePass] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState('');

  // Member email login fields
  const [memberEmail, setMemberEmail] = useState('');
  const [isMemberSubmitting, setIsMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState('');

  if (!isOpen) return null;

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) return;

    setIsAdminSubmitting(true);
    setAdminError('');
    try {
      const result = await loginAdmin(adminEmail.trim(), adminPassword);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
        onClose();
      } else {
        setAdminError(result.error || 'Неверный email или пароль');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Ошибка входа');
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;

    setIsMemberSubmitting(true);
    setMemberError('');
    try {
      const result = await loginMember(memberEmail.trim().toLowerCase(), activeProjectId || 'proj-1');
      if (result.success && result.user) {
        onLoginSuccess(result.user);
        onClose();
      } else {
        setMemberError(result.error || 'Email не найден в участниках проекта');
      }
    } catch (err: any) {
      setMemberError(err.message || 'Ошибка входа');
    } finally {
      setIsMemberSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setChangePassSuccess('');
    try {
      const res = await fetch('/api/auth/admin-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChangePassSuccess('Пароль администратора успешно изменен!');
        setShowChangePass(false);
        setOldPassword('');
        setNewPassword('');
      } else {
        setAdminError(data.error || 'Ошибка смены пароля');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Ошибка запроса');
    }
  };

  const handleLogout = async () => {
    await logoutAuth();
    onSignOut();
    onClose();
  };

  const isAdmin = currentUser.email.toLowerCase() === 'wl.chvlad@gmail.com' || currentUser.role === 'team';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Авторизация в системе</h2>
              <p className="text-xs text-slate-400">Вход для администратора и участников</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current user banner if logged in */}
        <div
          className={`px-5 sm:px-6 py-3 border-b flex items-center justify-between ${
            isDarkMode ? 'bg-[#111a2e] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 shadow">
              {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate text-slate-200">{currentUser.name}</span>
              <span className="text-[11px] font-mono text-slate-400 block truncate">{currentUser.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>

        {/* Tabs */}
        <div
          className={`grid grid-cols-2 border-b text-xs font-bold ${
            isDarkMode ? 'border-slate-800 bg-[#0d1320]' : 'border-slate-200 bg-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`py-3 px-4 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Администратор</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('member')}
            className={`py-3 px-4 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'member'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>По email (без пароля)</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {changePassSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{changePassSuccess}</span>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-4">
              {adminError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              {!showChangePass ? (
                <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                      Email администратора
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs border focus:outline-none focus:border-amber-500 ${
                        isDarkMode ? 'bg-[#182235] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      Пароль
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs border focus:outline-none focus:border-amber-500 ${
                        isDarkMode ? 'bg-[#182235] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAdminSubmitting || !adminEmail.trim() || !adminPassword.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAdminSubmitting ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Войти как Администратор</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setShowChangePass(true)}
                      className="text-[11px] text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Сменить пароль администратора</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3.5">
                  <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Смена пароля администратора
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Текущий пароль</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none focus:border-amber-500 ${
                        isDarkMode ? 'bg-[#182235] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Новый пароль</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none focus:border-amber-500 ${
                        isDarkMode ? 'bg-[#182235] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors cursor-pointer"
                    >
                      Сохранить новый пароль
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowChangePass(false)}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'member' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Введите ваш email. Если администратор добавил вас в список участников, доступ откроется мгновенно без пароля.
              </p>

              {memberError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{memberError}</span>
                </div>
              )}

              <form onSubmit={handleMemberSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    Ваш рабочий Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@gmail.com или partner@mail.kz"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs border focus:outline-none focus:border-amber-500 ${
                      isDarkMode ? 'bg-[#182235] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isMemberSubmitting || !memberEmail.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isMemberSubmitting ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Войти по email</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
