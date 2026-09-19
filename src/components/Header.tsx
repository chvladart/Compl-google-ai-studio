import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  FolderKanban,
  HardDrive,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  UserPlus,
  ChevronDown,
  Building2,
  Eye,
  Share2,
} from 'lucide-react';
import { Project, UserProfile, UserRole } from '../types';

interface HeaderProps {
  project: Project;
  user: UserProfile;
  projectsCount?: number;
  syncStatus?: 'synced' | 'syncing' | 'offline';
  isAdmin?: boolean;
  isRealAdmin?: boolean;
  simulatedRole?: UserRole | null;
  onSetSimulatedRole?: (role: UserRole | null) => void;
  onOpenSettings: () => void;
  onOpenProjectSwitcher: () => void;
  onOpenInvite: () => void;
  onOpenShare?: () => void;
  onOpenAuth: () => void;
  onOpenRooms?: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  onOpenRoleModal?: () => void;
  onOpenCloud: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  user,
  projectsCount = 1,
  syncStatus = 'synced',
  isAdmin = false,
  isRealAdmin = false,
  simulatedRole = null,
  onSetSimulatedRole,
  onOpenSettings,
  onOpenProjectSwitcher,
  onOpenInvite,
  onOpenShare,
  onOpenAuth,
  onOpenRooms,
  onExportPdf,
  onExportExcel,
  onOpenRoleModal,
  onOpenCloud,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur-md border-b px-3 sm:px-6 py-2.5 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#0d121c]/95 border-[#1c2638] text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Brand Logo & Project Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-md shadow-amber-500/20">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span
                  className={`font-extrabold tracking-wider text-sm ${
                    isDarkMode ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  COMPL<span className="text-amber-500">SPEC</span>
                </span>
              </div>
              <span className="text-[9px] font-bold tracking-[0.2em] text-amber-500 uppercase">
                STUDIO
              </span>
            </div>
          </div>

          <div
            className={`h-5 w-[1px] hidden sm:block ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />

          {/* Project Switcher Trigger */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenProjectSwitcher}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all max-w-[200px] sm:max-w-[320px] truncate cursor-pointer ${
                isDarkMode
                  ? 'bg-[#141c2b] border-amber-500/40 text-slate-100 hover:border-amber-400 hover:bg-[#1a2538]'
                  : 'bg-amber-50/70 border-amber-400 text-slate-900 hover:bg-amber-100'
              }`}
              title="Переключение между проектами и создание новых"
            >
              <FolderKanban className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">{project?.name || 'Проект'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-0.5" />
            </button>

            {/* Project Settings Trigger - only for Team / Admin */}
            {isAdmin && (
              <button
                onClick={onOpenSettings}
                className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'bg-[#141c2b] border-[#223049] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
                title="Параметры проекта: бюджет, адрес, комнаты"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions, Collaboration, Online DB, Exports, User */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Access & Role Management Admin Trigger - ONLY for Admin */}
          {isAdmin && (
            <>
              {onOpenShare && (
                <button
                  type="button"
                  onClick={onOpenShare}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                  }`}
                  title="Получить индивидуальную ссылку на проект для заказчика или подрядчика"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ссылка</span>
                </button>
              )}

              <button
                onClick={onOpenInvite}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25 shadow-sm'
                    : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                }`}
                title="Админ-панель: Управление доступом и распределение ролей участников проекта"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>Доступ и роли</span>
                {(() => {
                  const pendingCount = (project?.accessRequests || []).filter((r: any) => r.status === 'pending').length;
                  if (pendingCount > 0) {
                    return (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] animate-pulse">
                        +{pendingCount}
                      </span>
                    );
                  }
                  if (project?.members && project.members.length > 0) {
                    return (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                        {project.members.length}
                      </span>
                    );
                  }
                  return null;
                })()}
              </button>
            </>
          )}

          {/* Admin Role Simulation Switcher - Allows admin to preview as Client or Contractor */}
          {isRealAdmin && onSetSimulatedRole && (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-colors ${
                simulatedRole
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : isDarkMode
                  ? 'bg-[#141c2b] border-[#223049] text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Режим симуляции: проверьте, как проект видят Заказчик или Поставщик"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden xl:inline text-[11px] text-slate-400">Вид:</span>
              <select
                value={simulatedRole || 'admin'}
                onChange={(e) => {
                  const val = e.target.value;
                  onSetSimulatedRole(val === 'admin' ? null : (val as UserRole));
                }}
                className="bg-transparent font-bold text-xs cursor-pointer focus:outline-none"
              >
                <option value="admin" className="bg-slate-900 text-white">
                  Администратор (Вы)
                </option>
                <option value="client" className="bg-slate-900 text-emerald-300">
                  👁️ Заказчик (Клиент)
                </option>
                <option value="contractor" className="bg-slate-900 text-sky-300">
                  👁️ Поставщик
                </option>
              </select>
            </div>
          )}

          {/* Online Sync Indicator */}
          <button
            onClick={onOpenCloud}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#141c2b] border-[#223049] text-slate-300 hover:border-emerald-500/50'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-500'
            }`}
            title="Онлайн база данных: изменения синхронизируются автоматически в реальном времени"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">
              {syncStatus === 'syncing'
                ? 'Сохранение...'
                : syncStatus === 'offline'
                ? 'Офлайн'
                : 'Онлайн БД'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'syncing'
                  ? 'bg-amber-400 animate-pulse'
                  : syncStatus === 'offline'
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}
            />
          </button>

          {/* PDF Export Button */}
          <button
            type="button"
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Экспорт в PDF с качественной версткой"
          >
            <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>PDF</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Экспорт в Excel с формулами и суммами"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Excel</span>
          </button>

          {/* User Account / Auth Modal Trigger */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#141c2b] border-sky-800/40 text-sky-200 hover:bg-sky-950/40'
                : 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
            }`}
            title="Личный кабинет и профиль"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover border border-sky-400"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                {user.name[0].toUpperCase()}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <span className="block text-[11px] font-bold leading-tight truncate max-w-[100px]">
                {user.name}
              </span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#141c2b] border-[#223049] text-amber-400 hover:text-amber-300 hover:border-amber-500/50'
                : 'bg-slate-100 border-slate-300 text-amber-600 hover:bg-slate-200'
            }`}
            title={isDarkMode ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
