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
import { AuthModal } from './components/AuthModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { SupplierQuestionsModal } from './components/SupplierQuestionsModal';
import { ShieldAlert, Info, RefreshCw } from 'lucide-react';
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
  SupplierQuestion,
  UserProfile,
  UserRole,
} from './types';
import { exportSpecificationToExcel } from './utils/exportExcel';
import { exportSpecificationToPdf } from './utils/exportPdf';
import { calcItemTotal, CATEGORIES } from './utils/formatters';
import { ShareProjectModal } from './components/ShareProjectModal';
import { ProjectAccessGate } from './components/ProjectAccessGate';
import {
  checkSession,
  getStoredUser,
  loginMember,
  logoutAuth,
} from './utils/authClient';
import { extractUrlParams } from './utils/linkUtils';

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [gateProjectId, setGateProjectId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

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
  const [supplierQuestionsItem, setSupplierQuestionsItem] = useState<SpecificationItem | null>(null);
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);

  // 1. Is this user the project owner or supreme admin?
  const isRealAdmin = useMemo(() => {
    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    const ownerEmail = (project?.ownerEmail || '').toLowerCase().trim();
    if (userEmail === 'wl.chvlad@gmail.com') return true;
    if (ownerEmail && userEmail === ownerEmail) return true;
    return false;
  }, [currentUser?.email, project?.ownerEmail]);

  // 2. What role is assigned to this user in project.members or project.userRoleInProject?
  const assignedMemberRole = useMemo<UserRole | null>(() => {
    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    if (!userEmail) return null;
    if (isRealAdmin) return 'team';

    // 1. Check in project.members
    const member = project?.members?.find((m) => m.email.toLowerCase().trim() === userEmail);
    if (member) return member.role;

    // 2. Check in project.userRoleInProject returned by server
    if (project?.userRoleInProject) return project.userRoleInProject;

    // 3. Fallback: check in projects list for active project
    const currentProjFromList = projects.find((p) => p.id === activeProjectId);
    if (currentProjFromList?.userRoleInProject) return currentProjFromList.userRoleInProject;

    return null;
  }, [currentUser?.email, project?.members, project?.userRoleInProject, projects, activeProjectId, isRealAdmin]);

  // 3. Project access verification: is user authorized?
  const hasProjectAccess = useMemo(() => {
    if (isRealAdmin) return true;
    if (assignedMemberRole !== null) return true;
    return false;
  }, [isRealAdmin, assignedMemberRole]);

  // 4. Effective role for UI view
  const effectiveRole: UserRole = useMemo(() => {
    if (isRealAdmin && simulatedRole) {
      return simulatedRole;
    }
    if (isRealAdmin) return 'team';
    return assignedMemberRole || 'client';
  }, [isRealAdmin, simulatedRole, assignedMemberRole]);

  // 5. Admin privileges in UI
  const isAdmin = useMemo(() => {
    if (isRealAdmin && simulatedRole && simulatedRole !== 'team') {
      return false; // Hide admin buttons when simulating Client or Contractor
    }
    if (isRealAdmin) return true;
    return assignedMemberRole === 'team';
  }, [isRealAdmin, simulatedRole, assignedMemberRole]);

  // Synchronize currentUser role with effectiveRole
  useEffect(() => {
    if (currentUser.role !== effectiveRole) {
      setCurrentUser((prev) => ({
        ...prev,
        role: effectiveRole,
        roleTitle:
          effectiveRole === 'team'
            ? isRealAdmin ? 'Администратор (Владелец)' : 'Команда (Редактор)'
            : effectiveRole === 'contractor'
            ? 'Поставщик / Подрядчик'
            : 'Заказчик дизайн-проекта',
      }));
    }
  }, [effectiveRole, isRealAdmin, currentUser.role]);

  // Fetch projects list from server
  const loadProjects = useCallback(async (userEmail?: string) => {
    try {
      const url = userEmail
        ? `/api/projects?userEmail=${encodeURIComponent(userEmail.toLowerCase().trim())}`
        : '/api/projects';
      const res = await fetch(url, { cache: 'no-store' });
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
  const selectProject = useCallback(async (projectId: string, forUserEmail?: string) => {
    try {
      setSyncStatus('syncing');
      const emailParam = (forUserEmail || currentUser?.email || '').toLowerCase().trim();
      const url = emailParam
        ? `/api/projects/${projectId}?userEmail=${encodeURIComponent(emailParam)}`
        : `/api/projects/${projectId}`;
      const res = await fetch(url, { cache: 'no-store' });
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
  }, [currentUser?.email]);

  // Session & Project initialization
  useEffect(() => {
    const { projectId: projectParam } = extractUrlParams();

    const initApp = async () => {
      try {
        // 1. Check if an active session exists on server
        const sessionRes = await checkSession();
        if (sessionRes.valid && sessionRes.user) {
          const u = sessionRes.user;
          const isUserMasterAdmin =
            u.isAdmin ||
            u.email.toLowerCase().trim() === 'wl.chvlad@gmail.com' ||
            (project?.ownerEmail && u.email.toLowerCase().trim() === project.ownerEmail.toLowerCase().trim());

          if (isUserMasterAdmin) {
            const profile: UserProfile = {
              id: `adm-${u.email}`,
              name: u.name || 'Владислав (Администратор)',
              email: u.email,
              avatar: '',
              role: 'team',
              roleTitle: 'Администратор (Владелец)',
              isGoogleUser: false,
            };
            setCurrentUser(profile);
            const projs = await loadProjects(u.email);
            const targetId = projectParam || (projs && projs.length > 0 ? projs[0].id : INITIAL_PROJECT.id);
            if (targetId) {
              await selectProject(targetId, u.email);
            }
            setGateProjectId(null);
            setIsAuthChecking(false);
            return;
          }

          // If member has session and URL has projectParam: verify membership for THIS project!
          if (projectParam) {
            try {
              const checkRes = await fetch(
                `/api/projects/${encodeURIComponent(projectParam)}/access-check?email=${encodeURIComponent(u.email)}`
              ).then((r) => r.json());

              if (checkRes && checkRes.allowed) {
                const profile: UserProfile = {
                  id: `u-${u.email}`,
                  name: u.name,
                  email: u.email,
                  avatar: '',
                  role: checkRes.role || u.role,
                  roleTitle:
                    checkRes.role === 'contractor'
                      ? 'Поставщик / Подрядчик'
                      : checkRes.role === 'team'
                      ? 'Команда (Редактор)'
                      : 'Заказчик дизайн-проекта',
                  isGoogleUser: false,
                };
                setCurrentUser(profile);
                await loadProjects(u.email);
                await selectProject(projectParam, u.email);
                setGateProjectId(null);
                setIsAuthChecking(false);
                return;
              }
            } catch (e) {
              console.warn('Failed to verify project membership:', e);
            }

            // User is not a member of projectParam -> Block with ProjectAccessGate!
            setGateProjectId(projectParam);
            setIsAuthChecking(false);
            return;
          }

          // Session without projectParam: load user's projects
          const profile: UserProfile = {
            id: `u-${u.email}`,
            name: u.name,
            email: u.email,
            avatar: '',
            role: u.role,
            roleTitle:
              u.role === 'team'
                ? 'Команда (Редактор)'
                : u.role === 'contractor'
                ? 'Поставщик / Подрядчик'
                : 'Заказчик дизайн-проекта',
            isGoogleUser: false,
          };
          setCurrentUser(profile);
          const projs = await loadProjects(u.email);
          const targetId = u.projectId || (projs && projs.length > 0 ? projs[0].id : null);
          if (targetId) {
            await selectProject(targetId, u.email);
            setGateProjectId(null);
          }
          setIsAuthChecking(false);
          return;
        }

        // 2. If no session, check if URL has an individual project link (?project=...)
        if (projectParam) {
          // Check if member email was remembered for this project
          const rememberedEmail =
            typeof window !== 'undefined'
              ? localStorage.getItem(`complspec_email_${projectParam}`)
              : null;

          if (rememberedEmail) {
            const loginRes = await loginMember(rememberedEmail, projectParam);
            if (loginRes.success && loginRes.user) {
              setCurrentUser(loginRes.user);
              await loadProjects(loginRes.user.email);
              await selectProject(projectParam, loginRes.user.email);
              setGateProjectId(null);
              setIsAuthChecking(false);
              return;
            }
          }

          // Show individual project gate for visitor!
          setGateProjectId(projectParam);
          setIsAuthChecking(false);
          return;
        }

        // 3. No project param and no session: load default project as studio admin
        const projs = await loadProjects();
        if (projs && projs.length > 0) {
          await selectProject(projs[0].id);
        }
      } finally {
        setIsAuthChecking(false);
      }
    };

    initApp();
  }, [loadProjects, selectProject]);

  // Real-time automatic live synchronization (SSE instantaneous push + version-aware polling fallback)
  useEffect(() => {
    if (!activeProjectId) return;

    let isSubscribed = true;
    let eventSource: EventSource | null = null;

    const fetchLatestData = async () => {
      // Don't interrupt modal edit if user has item open
      if (editingItem !== null) return;
      try {
        const emailParam = (currentUser?.email || '').toLowerCase().trim();
        const url = emailParam
          ? `/api/projects/${activeProjectId}?userEmail=${encodeURIComponent(emailParam)}`
          : `/api/projects/${activeProjectId}`;
        const fullRes = await fetch(url, { cache: 'no-store' });
        if (!fullRes.ok) return;
        const fullData = await fullRes.json();
        if (isSubscribed && fullData && fullData.success && fullData.project) {
          setProject(fullData.project);
          setRooms(fullData.project.rooms || []);
          if (fullData.project.categories && fullData.project.categories.length > 0) {
            setCategories(fullData.project.categories);
          }
          setItems(fullData.items || []);
          setLastSyncedTime(new Date());
          setSyncStatus('synced');
        }
      } catch (err) {
        console.warn('Failed to fetch latest project data:', err);
      }
    };

    // 1. Establish SSE Connection for instant push
    try {
      eventSource = new EventSource(`/api/projects/${activeProjectId}/stream`);
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.type === 'sync' ||
            payload.type === 'project_updated' ||
            payload.type === 'members_updated' ||
            payload.type === 'access_requests_updated'
          ) {
            fetchLatestData();
          }
        } catch {
          // ignore heartbeat
        }
      };
      eventSource.onerror = () => {
        // SSE disconnected, fallback polling continues
      };
    } catch {
      // SSE not available
    }

    // 2. Resilient version-aware polling check
    const checkVersion = async () => {
      if (document.visibilityState !== 'visible' || editingItem !== null) return;
      try {
        const res = await fetch(`/api/projects/${activeProjectId}/version`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.success) {
          const serverVer = data.version;
          const currentVer = project.version;
          const needsRefresh =
            (serverVer !== undefined && currentVer !== undefined && serverVer > currentVer) ||
            (data.updatedAt && project.updatedAt && data.updatedAt !== project.updatedAt) ||
            (data.itemsCount !== undefined && items.length !== data.itemsCount);

          if (needsRefresh) {
            await fetchLatestData();
          }
        }
      } catch {
        // Background polling error ignored
      }
    };

    const intervalId = setInterval(checkVersion, 2500);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeProjectId, project.updatedAt, project.version, items.length, editingItem]);

  // Online Auto-save / Sync helper
  const syncWithServer = useCallback(
    async (updatedProject: Project, updatedItems: SpecificationItem[]) => {
      setSyncStatus('syncing');
      try {
        const res = await fetch(`/api/projects/${updatedProject.id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: updatedProject,
            items: updatedItems,
          }),
        });
        const data = await res.json();
        if (data && data.success) {
          setProject((prev) => ({
            ...prev,
            updatedAt: data.updatedAt,
            version: data.version,
          }));
        }
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

  const handleChangeMemberRole = async (email: string, role: UserRole) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (data.success && data.members) {
        setProject((prev) => ({
          ...prev,
          members: data.members,
          userRoleInProject:
            currentUser.email.toLowerCase() === email.toLowerCase() ? role : prev.userRoleInProject,
        }));
        if (currentUser.email.toLowerCase() === email.toLowerCase()) {
          setCurrentUser((prev) => ({
            ...prev,
            role,
            roleTitle:
              role === 'team'
                ? isRealAdmin ? 'Администратор (Владелец)' : 'Команда (Редактор)'
                : role === 'contractor'
                ? 'Поставщик / Подрядчик'
                : 'Заказчик дизайн-проекта',
          }));
        }
        // Also refresh project list for current user
        if (currentUser?.email) {
          loadProjects(currentUser.email);
        }
      }
    } catch (err) {
      console.error('Failed to change member role:', err);
    }
  };

  // --- Supplier Q&A Handlers (Visible only for Team and Contractor) ---
  const handleAddSupplierQuestion = async (itemId: string, text: string) => {
    const newQuestion: SupplierQuestion = {
      id: 'sq-' + Date.now(),
      author: currentUser.name || currentUser.email || (currentUser.role === 'contractor' ? 'Поставщик' : 'Команда'),
      role: currentUser.role === 'contractor' ? 'contractor' : 'team',
      text,
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    const nextItems = items.map((it) => {
      if (it.id === itemId) {
        const existing = it.supplierQuestions || [];
        return {
          ...it,
          supplierQuestions: [...existing, newQuestion],
        };
      }
      return it;
    });

    setItems(nextItems);
    if (supplierQuestionsItem && supplierQuestionsItem.id === itemId) {
      setSupplierQuestionsItem((prev) =>
        prev
          ? {
              ...prev,
              supplierQuestions: [...(prev.supplierQuestions || []), newQuestion],
            }
          : null
      );
    }

    await syncWithServer(project, nextItems);
  };

  const handleToggleResolveSupplierQuestion = async (itemId: string, questionId: string) => {
    const nextItems = items.map((it) => {
      if (it.id === itemId) {
        const existing = it.supplierQuestions || [];
        const updated = existing.map((q) =>
          q.id === questionId ? { ...q, resolved: !q.resolved } : q
        );
        return {
          ...it,
          supplierQuestions: updated,
        };
      }
      return it;
    });

    setItems(nextItems);
    if (supplierQuestionsItem && supplierQuestionsItem.id === itemId) {
      setSupplierQuestionsItem((prev) => {
        if (!prev) return null;
        const updated = (prev.supplierQuestions || []).map((q) =>
          q.id === questionId ? { ...q, resolved: !q.resolved } : q
        );
        return { ...prev, supplierQuestions: updated };
      });
    }

    await syncWithServer(project, nextItems);
  };

  // --- Auth & Access Handlers ---
  const handleLoginSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    setGateProjectId(null);
    const projs = await loadProjects(user.email);
    if (projs && projs.length > 0) {
      await selectProject(projs[0].id, user.email);
    }
  };

  const handleGateAccessGranted = async (user: UserProfile, projectData?: any) => {
    setGateProjectId(null);
    setCurrentUser(user);
    if (projectData) {
      setProject(projectData);
      setActiveProjectId(projectData.id);
      setRooms(projectData.rooms || []);
      if (projectData.categories && projectData.categories.length > 0) {
        setCategories(projectData.categories);
      }
    }
    const projs = await loadProjects(user.email);
    const targetId = projectData?.id || activeProjectId;
    if (targetId) {
      await selectProject(targetId, user.email);
    }
  };

  const handleSignOut = async () => {
    await logoutAuth();
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

  if (isAuthChecking) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? 'bg-[#0a0e17] text-slate-400' : 'bg-slate-50 text-slate-500'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium tracking-wide">Загрузка проекта...</span>
        </div>
      </div>
    );
  }

  if (gateProjectId || (!hasProjectAccess && activeProjectId && !isRealAdmin)) {
    return (
      <ProjectAccessGate
        projectId={gateProjectId || activeProjectId}
        onAccessGranted={handleGateAccessGranted}
        isDarkMode={isDarkMode}
      />
    );
  }

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
        isAdmin={isAdmin}
        isRealAdmin={isRealAdmin}
        simulatedRole={simulatedRole}
        onSetSimulatedRole={(role) => setSimulatedRole(role)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenProjectSwitcher={() => setIsProjectSwitcherOpen(true)}
        onOpenInvite={() => setIsInviteModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenRooms={() => setIsRoomsModalOpen(true)}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenCloud={() => setIsCloudModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Role simulation indicator banner for Administrator */}
      {isRealAdmin && simulatedRole && (
        <div className="border-b px-4 py-2.5 bg-amber-500/15 border-amber-500/30 text-amber-200">
          <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] bg-amber-500 text-slate-950">
                Режим симуляции
              </span>
              <span>
                Вы просматриваете проект глазами{' '}
                <strong>
                  {simulatedRole === 'client' ? 'Заказчика (Клиента)' : 'Поставщика / Подрядчика'}
                </strong>
                . Закупочные скидки и кнопки управления скрыты.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSimulatedRole(null)}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow transition-all"
            >
              Вернуться в режим Администратора
            </button>
          </div>
        </div>
      )}

      {/* Member identity banner for non-admin team, client or contractor */}
      {!isRealAdmin && (
        <div
          className={`border-b px-4 py-2 transition-colors ${
            effectiveRole === 'contractor'
              ? 'bg-sky-500/10 border-sky-500/20 text-sky-200'
              : effectiveRole === 'client'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
          }`}
        >
          <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                  effectiveRole === 'contractor'
                    ? 'bg-sky-500 text-slate-950'
                    : effectiveRole === 'client'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                {effectiveRole === 'team'
                  ? 'Команда'
                  : effectiveRole === 'contractor'
                  ? 'Поставщик'
                  : 'Заказчик'}
              </span>
              <span>
                Вы авторизованы как <strong>{currentUser.email}</strong> • Проект: <strong>{project.name}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-[1700px] mx-auto px-3 sm:px-6 py-4 space-y-4">
        {!hasProjectAccess ? (
          <div className="max-w-lg mx-auto my-16 p-8 rounded-2xl border bg-[#0f172a] border-slate-800 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Доступ ожидает подтверждения</h2>
              <p className="text-sm text-slate-300">
                Вы вошли как <span className="font-mono font-bold text-amber-400">{currentUser.email}</span>.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Администратор проекта (<strong>{project?.ownerEmail || 'Vladislav Churikov'}</strong>) ещё не добавил вашу почту в список участников проекта «<strong>{project.name}</strong>».
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#141c2b] border border-slate-700/60 text-left text-xs text-slate-300 space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Что делать:
              </div>
              <p className="text-slate-400">
                Попросите администратора добавить ваш email <code className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">{currentUser.email}</code> в разделе <strong>«Доступ и роли»</strong> с назначением роли (Заказчик, Поставщик или Команда).
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => selectProject(activeProjectId)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Проверить доступ
              </button>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                Сменить аккаунт
              </button>
            </div>
          </div>
        ) : (
          <>
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
                onOpenSupplierQuestions={(item) => setSupplierQuestionsItem(item)}
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
                onOpenSupplierQuestions={(item) => setSupplierQuestionsItem(item)}
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
          </>
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
        currentUserRole={effectiveRole}
        isDarkMode={isDarkMode}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen && isAdmin}
        onClose={() => setIsInviteModalOpen(false)}
        project={project}
        onInviteMember={handleInviteMember}
        onRemoveMember={handleRemoveMember}
        onChangeMemberRole={handleChangeMemberRole}
        currentUserEmail={currentUser.email}
        isDarkMode={isDarkMode}
      />

      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={project}
        onOpenInviteMembers={() => setIsInviteModalOpen(true)}
        isDarkMode={isDarkMode}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        activeProjectId={activeProjectId}
        onLoginSuccess={handleLoginSuccess}
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

      <SupplierQuestionsModal
        isOpen={!!supplierQuestionsItem}
        onClose={() => setSupplierQuestionsItem(null)}
        item={supplierQuestionsItem}
        userRole={currentUser.role}
        currentUserName={currentUser.name}
        onAddQuestion={handleAddSupplierQuestion}
        onToggleResolve={handleToggleResolveSupplierQuestion}
        onStatusChange={(itemId, newStatus) => handleStatusChange(itemId, newStatus)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
