import React, { useState } from 'react';
import { Project, UserRole } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  FolderKanban,
  Plus,
  Check,
  Trash2,
  Copy,
  Building2,
  Users,
  Search,
  X,
  Sparkles,
} from 'lucide-react';

interface ProjectSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (projectData: Partial<Project>) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onDuplicateProject?: (projectId: string) => Promise<void>;
  currentUserEmail?: string;
  currentUserRole?: UserRole;
  isDarkMode?: boolean;
}

export const ProjectSwitcherModal: React.FC<ProjectSwitcherModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
  currentUserEmail,
  currentUserRole = 'team',
  isDarkMode = true,
}) => {
  const isTeam = currentUserRole === 'team';
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields for new project
  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newArea, setNewArea] = useState<number>(85);
  const [newBudget, setNewBudget] = useState<number>(18000000);
  const [newDesc, setNewDesc] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateProject({
        name: newName.trim(),
        client: newClient.trim() || 'Заказчик',
        address: newAddress.trim() || 'г. Алматы / Астана',
        area: Number(newArea) || 85,
        totalBudget: Number(newBudget) || 15000000,
        currency: '₸',
        description: newDesc.trim() || 'Спецификация комплектации интерьера',
      });
      setIsCreating(false);
      setNewName('');
      setNewClient('');
      setNewAddress('');
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-3xl rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
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
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Проекты комплектации</h2>
              <p className="text-xs text-slate-400">
                Всего проектов: {projects.length} &bull; Переключение в 1 клик
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTeam && !isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Новый проект
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Create New Project Form */}
          {isCreating ? (
            <form
              onSubmit={handleCreateSubmit}
              className={`p-5 rounded-2xl border space-y-4 ${
                isDarkMode ? 'bg-[#131d31] border-amber-500/30' : 'bg-amber-50/50 border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  Создание нового дизайн-проекта
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Отмена
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Название проекта / объекта <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: ЖК «Sensata City», кв. 118"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-none focus:border-amber-500 ${
                      isDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ФИО Клиента</label>
                  <input
                    type="text"
                    placeholder="Алибек и Сабина"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-none focus:border-amber-500 ${
                      isDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Адрес объекта</label>
                  <input
                    type="text"
                    placeholder="г. Алматы, пр. Достык, 105"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-none focus:border-amber-500 ${
                      isDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Площадь, м²</label>
                  <input
                    type="number"
                    min="1"
                    value={newArea}
                    onChange={(e) => setNewArea(Number(e.target.value) || 0)}
                    className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-none focus:border-amber-500 ${
                      isDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Бюджет комплектации (₸)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={newBudget}
                    onChange={(e) => setNewBudget(Number(e.target.value) || 0)}
                    className={`w-full rounded-xl px-3.5 py-2 text-sm border font-mono font-bold focus:outline-none focus:border-amber-500 ${
                      isDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Описание / Концепция</label>
                  <textarea
                    rows={2}
                    placeholder="Краткие заметки по стилю, особым пожеланиям заказчика..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-none focus:border-amber-500 ${
                      isDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Создание...' : 'Создать проект и открыть'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск проекта по названию, клиенту или адресу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-xl pl-10 pr-4 py-2 text-sm border focus:outline-none focus:border-amber-500 ${
                    isDarkMode ? 'bg-[#131d31] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Projects List */}
              <div className="grid grid-cols-1 gap-3">
                {filteredProjects.map((p) => {
                  const isActive = p.id === activeProjectId;
                  const isOwner = !p.ownerEmail || !currentUserEmail || p.ownerEmail.toLowerCase() === currentUserEmail.toLowerCase();
                  const roleLabel = isOwner ? 'Владелец' : p.userRoleInProject === 'client' ? 'Заказчик' : 'Подрядчик';

                  return (
                    <div
                      key={p.id}
                      className={`group p-4 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                        isActive
                          ? isDarkMode
                            ? 'bg-[#182641] border-amber-500 shadow-md ring-1 ring-amber-500/50'
                            : 'bg-amber-50 border-amber-400 shadow-sm'
                          : isDarkMode
                          ? 'bg-[#131d31] border-slate-800 hover:border-slate-700 hover:bg-[#162238]'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                      onClick={() => {
                        onSelectProject(p.id);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm truncate">{p.name}</h3>
                            {isActive && (
                              <span className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <Check className="w-3 h-3" /> Текущий
                              </span>
                            )}
                            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                              {roleLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 truncate">
                            <span>Клиент: <strong className="text-slate-200">{p.client}</strong></span>
                            <span>&bull;</span>
                            <span>{p.address}</span>
                            <span>&bull;</span>
                            <span>{p.area} м²</span>
                            <span>&bull;</span>
                            <span className="font-semibold text-amber-400">
                              {formatCurrency(p.totalBudget)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isTeam && onDuplicateProject && (
                          <button
                            title="Дублировать проект"
                            onClick={() => onDuplicateProject(p.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        {isTeam && onDeleteProject && projects.length > 1 && (
                          <button
                            title="Удалить проект"
                            onClick={() => {
                              if (window.confirm(`Вы уверены, что хотите удалить проект "${p.name}"?`)) {
                                onDeleteProject(p.id);
                              }
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onSelectProject(p.id);
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          }`}
                        >
                          {isActive ? 'Открыт' : 'Выбрать'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredProjects.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm">Проекты не найдены</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
