import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { CardsView } from './components/CardsView';
import { CloudSyncModal } from './components/CloudSyncModal';
import { EmailExportModal } from './components/EmailExportModal';
import { FilterToolbar, GroupByMode, ViewMode } from './components/FilterToolbar';
import { Header } from './components/Header';
import { ItemModal } from './components/ItemModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { ProjectHero } from './components/ProjectHero';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { QrModal } from './components/QrModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { RoomsModal } from './components/RoomsModal';
import { SummaryView } from './components/SummaryView';
import { TableView } from './components/TableView';
import { ProjectSwitcherModal } from './components/ProjectSwitcherModal';
import { InviteMemberModal } from './components/InviteMemberModal';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { AuthModal } from './components/AuthModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import {
  INITIAL_ITEMS,
  INITIAL_PROJECT,
  INITIAL_ROOMS,
  MOCK_USER_CLIENT,
  MOCK_USER_CONTRACTOR,
  MOCK_USER_TEAM,
} from './data/initialData';
import {
  ClientApprovalStatus,
  ItemCategory,
  ItemStatus,
  Project,
  Room,
  SpecificationItem,
  UserProfile,
  UserRole,
} from './types';
import { exportSpecificationToExcel } from './utils/exportExcel';
import { exportSpecificationToPdf } from './utils/exportPdf';
import { calcItemTotal, CATEGORIES } from './utils/formatters';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  setCachedAccessToken,
} from './utils/firebaseAuth';

export default function App() {
  // 1. Projects & Multi-Project State
  const [projects, setProjects] = useState<Project[]>([INITIAL_PROJECT]);
  const [activeProjectId, setActiveProjectId] = useState<string>(INITIAL_PROJECT.id);
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [items, setItems] = useState<SpecificationItem[]>(INITIAL_ITEMS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [categories, setCategories] = useState<string[]>(
    INITIAL_PROJECT.categories && INITIAL_PROJECT.categories.length > 0
      ? INITIAL_PROJECT.categories
      : CATEGORIES
  );

  // 2. User & Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USER_TEAM);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // 3. UI and Sync State
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // 4. View & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [groupBy, setGroupBy] = useState<GroupByMode>('room');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [onlyWithDiscount, setOnlyWithDiscount] = useState(false);

  // 5. Modals State
  const [isProjectSwitcherOpen, setIsProjectSwitcherOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecificationItem | null>(null);
  const [defaultRoomIdForItem, setDefaultRoomIdForItem] = useState<string | undefined>();

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState('');
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [lightboxAllPhotos, setLightboxAllPhotos] = useState<string[]>([]);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalItem, setQrModalItem] = useState<SpecificationItem | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isRoomsModalOpen, setIsRoomsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SpecificationItem | null>(null);

  // Fetch projects list from server
  const loadProjects = useCallback(async (userEmail?: string) => {
    try {
      const url = userEmail
        ? `/api/projects?userEmail=${encodeURIComponent(userEmail)}`
        : '/api/projects';
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.projects) && data.projects.length > 0) {
        setProjects(data.projects);
        return data.projects;
      }
    } catch (err) {
      console.warn('Failed to load projects from server:', err);
    }
    return null;
  }, []);

  // Fetch specific project details & its items
  const selectProject = useCallback(async (projectId: string) => {
    try {
      setSyncStatus('syncing');
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (data && data.success && data.project) {
        setProject(data.project);
        setActiveProjectId(data.project.id);
        setRooms(data.project.rooms || []);
        if (data.project.categories && data.project.categories.length > 0) {
          setCategories(data.project.categories);
        }
        setItems(data.items || []);
        setSyncStatus('synced');
        setLastSyncedTime(new Date());
      }
    } catch (err) {
      console.error('Error selecting project:', err);
      setSyncStatus('offline');
    }
  }, []);

  // Initialize Firebase Auth listener and URL query params
  useEffect(() => {
    // 1. Check URL query params for role or direct project linking
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const projectParam = params.get('project');

    if (roleParam === 'client') {
      setCurrentUser(MOCK_USER_CLIENT);
    } else if (roleParam === 'contractor') {
      setCurrentUser(MOCK_USER_CONTRACTOR);
    }

    // 2. Initialize Firebase Auth
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setAccessToken(token);
        if (token) setCachedAccessToken(token);

        // Register user in server database workspace
        try {
          const res = await fetch('/api/auth/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              avatar: firebaseUser.photoURL,
            }),
          });
          const authData = await res.json();
          if (authData.success && authData.user) {
            setCurrentUser({
              id: authData.user.id,
              name: authData.user.name,
              email: authData.user.email,
              avatar: authData.user.avatar || firebaseUser.photoURL || '',
              role: (authData.user.role as UserRole) || 'team',
              roleTitle: 'Владелец базы данных',
              isGoogleUser: true,
            });

            // Load user's projects
            const userProjs = await loadProjects(authData.user.email);
            if (userProjs && userProjs.length > 0) {
              const targetProj = projectParam
                ? userProjs.find((p: Project) => p.id === projectParam) || userProjs[0]
                : userProjs[0];
              await selectProject(targetProj.id);
            }
          }
        } catch (err) {
          console.warn('Failed to sync user with server:', err);
        }
      },
      () => {
        // Logged out / unauthenticated fallback
        loadProjects().then((projs) => {
          if (projs && projs.length > 0) {
            const targetProj = projectParam
              ? projs.find((p: Project) => p.id === projectParam) || projs[0]
              : projs[0];
            selectProject(targetProj.id);
          }
        });
      }
    );

    return () => unsubscribe();
  }, [loadProjects, selectProject]);

  // Online Auto-save / Sync helper
  const syncWithServer = useCallback(
    async (updatedProject: Project, updatedItems: SpecificationItem[]) => {
      setSyncStatus('syncing');
      try {
        await fetch(`/api/projects/${updatedProject.id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: updatedProject,
            items: updatedItems,
          }),
        });
        setSyncStatus('synced');
        setLastSyncedTime(new Date());
      } catch (err) {
        console.warn('Sync failed:', err);
        setSyncStatus('offline');
      }
    },
    []
  );

  // --- Project CRUD ---
  const handleCreateProject = async (projectData: Partial<Project>) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: projectData,
          creator: {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.project) {
        await loadProjects(currentUser.email);
        await selectProject(data.project.id);
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    try {
      await fetch(`/api/projects/${projId}`, { method: 'DELETE' });
      const updatedList = await loadProjects(currentUser.email);
      if (updatedList && updatedList.length > 0) {
        if (projId === activeProjectId) {
          await selectProject(updatedList[0].id);
        }
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const handleDuplicateProject = async (projId: string) => {
    const target = projects.find((p) => p.id === projId);
    if (!target) return;

    await handleCreateProject({
      ...target,
      name: `${target.name} (Копия)`,
      id: undefined,
    });
  };

  // --- Invitations & Collaboration ---
  const handleInviteMember = async (email: string, role: UserRole) => {
    const res = await fetch(`/api/projects/${project.id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviterEmail: currentUser.email,
        email,
        role,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Не удалось отправить приглашение');
    }

    // Refresh current project members
    if (data.member) {
      const updatedMembers = [...(project.members || [])];
      const idx = updatedMembers.findIndex((m) => m.email === email);
      if (idx >= 0) {
        updatedMembers[idx] = data.member;
      } else {
        updatedMembers.push(data.member);
      }
      setProject((prev) => ({ ...prev, members: updatedMembers }));
    }
  };

  const handleRemoveMember = async (email: string) => {
    await fetch(`/api/projects/${project.id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setProject((prev) => ({
      ...prev,
      members: (prev.members || []).filter((m) => m.email.toLowerCase() !== email.toLowerCase()),
    }));
  };

  // --- Auth Handlers ---
  const handleGoogleSignIn = async () => {
    const { user: fbUser, accessToken: token } = await googleSignIn();
    setAccessToken(token);
    setCachedAccessToken(token);

    const res = await fetch('/api/auth/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName,
        avatar: fbUser.photoURL,
      }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      setCurrentUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar || fbUser.photoURL || '',
        role: 'team',
        roleTitle: 'Дизайнер / Владелец',
        isGoogleUser: true,
      });

      const userProjs = await loadProjects(data.user.email);
      if (userProjs && userProjs.length > 0) {
        await selectProject(userProjs[0].id);
      }
    }
  };

  const handleManualSignIn = async (email: string, name: string) => {
    const res = await fetch('/api/auth/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `user-${Date.now()}`,
        email,
        name,
      }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      setCurrentUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: '',
        role: 'team',
        roleTitle: 'Дизайнер / Комплектатор',
        isGoogleUser: false,
      });

      const userProjs = await loadProjects(data.user.email);
      if (userProjs && userProjs.length > 0) {
        await selectProject(userProjs[0].id);
      }
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setAccessToken(null);
    setCurrentUser(MOCK_USER_TEAM);
    const defaultProjs = await loadProjects();
    if (defaultProjs && defaultProjs.length > 0) {
      await selectProject(defaultProjs[0].id);
    }
  };

  // --- Items CRUD Handlers ---
  const handleSaveItem = (savedItem: SpecificationItem) => {
    let nextItems: SpecificationItem[];
    const exists = items.some((it) => it.id === savedItem.id);
    if (exists) {
      nextItems = items.map((it) => (it.id === savedItem.id ? savedItem : it));
    } else {
      nextItems = [savedItem, ...items];
    }
    setItems(nextItems);
    syncWithServer(project, nextItems);
  };

  const handleDeleteItem = (id: string) => {
    const target = items.find((it) => it.id === id);
    if (target) {
      setItemToDelete(target);
    } else {
      const nextItems = items.filter((it) => it.id !== id);
      setItems(nextItems);
      syncWithServer(project, nextItems);
    }
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const nextItems = items.filter((it) => it.id !== itemToDelete.id);
    setItems(nextItems);
    syncWithServer(project, nextItems);
    setItemToDelete(null);
  };

  const handleStatusChange = (id: string, newStatus: ItemStatus) => {
    const nextItems = items.map((it) =>
      it.id === id ? { ...it, status: newStatus, updatedAt: new Date().toISOString() } : it
    );
    setItems(nextItems);
    syncWithServer(project, nextItems);
  };

  const handleClientStatusChange = (
    id: string,
    newClientStatus: ClientApprovalStatus,
    comment?: string
  ) => {
    const nextItems = items.map((it) => {
      if (it.id !== id) return it;
      const updated: SpecificationItem = {
        ...it,
        clientStatus: newClientStatus,
        clientComment: comment !== undefined ? comment : it.clientComment,
        updatedAt: new Date().toISOString(),
      };
      if (newClientStatus === 'approved') {
        updated.status = 'approved';
      }
      return updated;
    });
    setItems(nextItems);
    syncWithServer(project, nextItems);
  };

  const handleQuantityChange = (id: string, newQty: number) => {
    const nextItems = items.map((it) =>
      it.id === id ? { ...it, quantity: newQty, updatedAt: new Date().toISOString() } : it
    );
    setItems(nextItems);
    syncWithServer(project, nextItems);
  };

  // Role Switcher
  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === 'team') setCurrentUser(MOCK_USER_TEAM);
    else if (newRole === 'client') setCurrentUser(MOCK_USER_CLIENT);
    else if (newRole === 'contractor') setCurrentUser(MOCK_USER_CONTRACTOR);
  };

  // Direct Exports
  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportMessage('Генерация альбома спецификации в высоком качестве (PDF)...');
    try {
      const blob = await exportSpecificationToPdf(project, items, (msg) => setExportMessage(msg));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Спецификация_${project.name.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
      a.click();
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Ошибка при экспорте PDF');
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportMessage('Формирование таблицы Excel с формулами в тенге (тг)...');
    try {
      const blob = await exportSpecificationToExcel(project, items, (msg) => setExportMessage(msg));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ведомость_${project.name.replace(/[/\\?%*:|"<>]/g, '_')}.xlsx`;
      a.click();
    } catch (err) {
      console.error('Excel export error:', err);
      alert('Ошибка при экспорте Excel');
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  };

  // Open modals helpers
  const handleOpenAddItem = (roomId?: string) => {
    setEditingItem(null);
    setDefaultRoomIdForItem(roomId);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: SpecificationItem) => {
    setEditingItem(item);
    setDefaultRoomIdForItem(undefined);
    setIsItemModalOpen(true);
  };

  const handleOpenLightbox = (photoUrl: string, title: string, allPhotos?: string[]) => {
    setLightboxPhoto(photoUrl);
    setLightboxTitle(title);
    setLightboxAllPhotos(allPhotos || [photoUrl]);
    setIsLightboxOpen(true);
  };

  const handleOpenQr = (item: SpecificationItem) => {
    setQrModalItem(item);
    setIsQrModalOpen(true);
  };

  // Filtered Items Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Room filter
      if (selectedRoom !== 'all' && item.roomId !== selectedRoom) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }
      // Discount filter
      if (onlyWithDiscount && (!item.supplierDiscount || item.supplierDiscount <= 0)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchCode = item.code.toLowerCase().includes(query);
        const matchBrand = (item.brand || '').toLowerCase().includes(query);
        const matchArticle = (item.article || '').toLowerCase().includes(query);
        const matchSupplier = (item.supplier || '').toLowerCase().includes(query);
        const matchNotes = (item.techNotes || '').toLowerCase().includes(query);
        const matchRoom = (item.roomName || '').toLowerCase().includes(query);

        if (
          !matchName &&
          !matchCode &&
          !matchBrand &&
          !matchArticle &&
          !matchSupplier &&
          !matchNotes &&
          !matchRoom
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedRoom, selectedCategory, selectedStatus, onlyWithDiscount, searchQuery]);

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? 'bg-[#0a0e17] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header */}
      <Header
        project={project}
        user={currentUser}
        projectsCount={projects.length}
        syncStatus={syncStatus}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenProjectSwitcher={() => setIsProjectSwitcherOpen(true)}
        onOpenInvite={() => setIsInviteModalOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenRooms={() => setIsRoomsModalOpen(true)}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenCloud={() => setIsCloudModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Container */}
      <main className="max-w-[1700px] mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Project Hero / Overview */}
        <ProjectHero
          project={project}
          items={items}
          userRole={currentUser.role}
          isDarkMode={isDarkMode}
          onOpenAddItem={() => handleOpenAddItem()}
        />

        {/* Filter Toolbar */}
        <FilterToolbar
          rooms={rooms}
          categories={categories}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedRoom={selectedRoom}
          onRoomChange={setSelectedRoom}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onlyWithDiscount={onlyWithDiscount}
          onDiscountToggle={() => setOnlyWithDiscount(!onlyWithDiscount)}
          totalFilteredCount={filteredItems.length}
          totalItemsCount={items.length}
          isDarkMode={isDarkMode}
          onOpenAddItem={() => handleOpenAddItem()}
          userRole={currentUser.role}
        />

        {/* Primary Views */}
        {viewMode === 'table' && (
          <TableView
            items={filteredItems}
            rooms={rooms}
            groupBy={groupBy}
            userRole={currentUser.role}
            isDarkMode={isDarkMode}
            onEditItem={handleOpenEditItem}
            onDeleteItem={handleDeleteItem}
            onStatusChange={handleStatusChange}
            onClientStatusChange={handleClientStatusChange}
            onQuantityChange={handleQuantityChange}
            onOpenLightbox={handleOpenLightbox}
            onOpenQr={handleOpenQr}
            onAddItemInGroup={(roomId) => handleOpenAddItem(roomId)}
          />
        )}

        {viewMode === 'cards' && (
          <CardsView
            items={filteredItems}
            rooms={rooms}
            groupBy={groupBy}
            userRole={currentUser.role}
            isDarkMode={isDarkMode}
            onEditItem={handleOpenEditItem}
            onDeleteItem={handleDeleteItem}
            onStatusChange={handleStatusChange}
            onClientStatusChange={handleClientStatusChange}
            onQuantityChange={handleQuantityChange}
            onOpenPhoto={handleOpenLightbox}
            onOpenLightbox={handleOpenLightbox}
            onOpenQr={handleOpenQr}
            onAddItemInGroup={(roomId) => handleOpenAddItem(roomId)}
          />
        )}

        {viewMode === 'summary' && (
          <SummaryView
            project={project}
            items={items}
            rooms={rooms}
            isDarkMode={isDarkMode}
            onSelectRoom={(roomId) => {
              setSelectedRoom(roomId);
              setViewMode('table');
            }}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setViewMode('table');
            }}
          />
        )}
      </main>

      {/* Export loading overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-[#141c2b] border border-amber-500/40 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="font-bold text-white text-base">Экспорт ведомости</h3>
            <p className="text-xs text-slate-400">{exportMessage}</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProjectSwitcherModal
        isOpen={isProjectSwitcherOpen}
        onClose={() => setIsProjectSwitcherOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={selectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        currentUserEmail={currentUser.email}
        isDarkMode={isDarkMode}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        project={project}
        onInviteMember={handleInviteMember}
        onRemoveMember={handleRemoveMember}
        currentUserEmail={currentUser.email}
        isDarkMode={isDarkMode}
      />

      <GoogleDriveSyncModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        project={project}
        items={items}
        accessToken={accessToken}
        currentUserEmail={currentUser.email}
        onLoginGoogle={handleGoogleSignIn}
        onRestoreFromBackup={(restoredProj, restoredItems) => {
          setProject(restoredProj);
          setItems(restoredItems);
          setRooms(restoredProj.rooms || []);
          syncWithServer(restoredProj, restoredItems);
        }}
        isDarkMode={isDarkMode}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        onManualSignIn={handleManualSignIn}
        onSignOut={handleSignOut}
        isDarkMode={isDarkMode}
      />

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        initialItem={editingItem}
        rooms={rooms}
        categories={categories}
        isDarkMode={isDarkMode}
        defaultRoomId={defaultRoomIdForItem}
      />

      <PhotoLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        currentPhoto={lightboxPhoto}
        title={lightboxTitle}
        allPhotos={lightboxAllPhotos}
      />

      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        item={qrModalItem}
        projectName={project.name}
      />

      <EmailExportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        project={project}
        items={items}
      />

      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        user={currentUser}
        onUpdateRole={handleRoleChange}
        onUpdateUser={setCurrentUser}
      />

      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        project={project}
        items={items}
        lastSyncedTime={lastSyncedTime}
        onManualSync={() => syncWithServer(project, items)}
        onImportProjectData={({ project: newProj, items: newItems }) => {
          setProject(newProj);
          setItems(newItems);
          setRooms(newProj.rooms || []);
          syncWithServer(newProj, newItems);
        }}
      />

      <RoomsModal
        isOpen={isRoomsModalOpen}
        onClose={() => setIsRoomsModalOpen(false)}
        rooms={rooms}
        onAddRoom={(newRoom) => {
          const updated = [...rooms, newRoom];
          setRooms(updated);
          const updatedProj = { ...project, rooms: updated };
          setProject(updatedProj);
          syncWithServer(updatedProj, items);
        }}
        onDeleteRoom={(id) => {
          const updated = rooms.filter((r) => r.id !== id);
          setRooms(updated);
          const updatedProj = { ...project, rooms: updated };
          setProject(updatedProj);
          syncWithServer(updatedProj, items);
        }}
      />

      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        project={project}
        rooms={rooms}
        categories={categories}
        isDarkMode={isDarkMode}
        onSaveProject={(updatedProject, updatedRooms, updatedCategories) => {
          const finalProject = {
            ...updatedProject,
            categories: updatedCategories,
            rooms: updatedRooms,
            currency: '₸',
          };
          setProject(finalProject);
          setRooms(updatedRooms);
          setCategories(updatedCategories);
          syncWithServer(finalProject, items);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        item={itemToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
