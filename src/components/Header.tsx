import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  FolderKanban,
  HardDrive,
  Moon,
  Plus,
  Settings,
  ShieldCheck,
  Sun,
  UserPlus,
  Cloud,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { Project, UserProfile } from '../types';

interface HeaderProps {
  project: Project;
  user: UserProfile;
  projectsCount?: number;
  syncStatus?: 'synced' | 'syncing' | 'offline';
  onOpenSettings: () => void;
  onOpenProjectSwitcher: () => void;
  onOpenInvite: () => void;
  onOpenGoogleDrive: () => void;
  onOpenAuth: () => void;
  onOpenRooms?: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  onOpenRoleModal: () => void;
  onOpenCloud: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  user,
  projectsCount = 1,
  syncStatus = 'synced',
  onOpenSettings,
  onOpenProjectSwitcher,
  onOpenInvite,
  onOpenGoogleDrive,
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all max-w-[180px] sm:max-w-[280px] truncate cursor-pointer ${
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

            {/* Quick Add Project button */}
            <button
              onClick={onOpenProjectSwitcher}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                isDarkMode
                  ? 'bg-[#141c2b] border-[#223049] text-amber-400 hover:border-amber-500 hover:bg-[#1a2538]'
                  : 'bg-slate-50 border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400'
              }`}
              title="Создать или выбрать проект"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Проекты ({projectsCount})</span>
            </button>

            {/* Project Settings Trigger */}
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
          </div>
        </div>

        {/* Right: Actions, Collaboration, Google Drive, Exports, User */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Invite Collaborator (Team, Client, Contractor) */}
          <button
            onClick={onOpenInvite}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
            }`}
            title="Пригласить в проект: команду, заказчика или подрядчика"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-500" />
            <span>Пригласить</span>
            {project?.members && project.members.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                {project.members.length}
              </span>
            )}
          </button>

          {/* Google Drive Sync Button */}
          <button
            onClick={onOpenGoogleDrive}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#141c2b] border-blue-900/40 text-blue-300 hover:border-blue-500/50 hover:bg-blue-950/20'
                : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
            }`}
            title="Синхронизация с Google Диском (Excel, PDF, база данных)"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Google Диск</span>
          </button>

          {/* Online Sync Indicator */}
          <button
            onClick={onOpenCloud}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#141c2b] border-[#223049] text-slate-300 hover:border-emerald-500/50'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-500'
            }`}
            title="Онлайн база данных: изменения сохраняются автоматически"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden xl:inline">
              {syncStatus === 'syncing' ? 'Сохранение...' : 'Онлайн БД'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
              }`}
            />
          </button>

          {/* PDF Export Button */}
          <button
            type="button"
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Экспорт в PDF с качественной версткой без съездов текста и ценами в ₸"
          >
            <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>PDF (₸)</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Экспорт в Excel с формулами и суммами в тенге (₸)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Excel (₸)</span>
          </button>

          {/* User Account / Auth Modal Trigger */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#141c2b] border-sky-800/40 text-sky-200 hover:bg-sky-950/40'
                : 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
            }`}
            title="Личный кабинет и база данных пользователя"
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
