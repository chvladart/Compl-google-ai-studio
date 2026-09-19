import { UserProfile, UserRole } from '../types';

const TOKEN_KEY = 'complspec_auth_token';
const USER_KEY = 'complspec_auth_user';

export interface AuthSessionResponse {
  valid: boolean;
  user?: {
    email: string;
    name: string;
    role: UserRole;
    isAdmin: boolean;
    projectId?: string;
  };
  error?: string;
}

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: UserProfile): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Admin login with Email + Password
 */
export const loginAdmin = async (
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: UserProfile; error?: string }> => {
  try {
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Неверный email или пароль' };
    }

    const profile: UserProfile = {
      id: `adm-${data.user.email}`,
      name: data.user.name || 'Владислав (Администратор)',
      email: data.user.email,
      avatar: '',
      role: 'team',
      roleTitle: 'Администратор (Владелец студии)',
      isGoogleUser: false,
    };

    setStoredToken(data.token);
    setStoredUser(profile);
    return { success: true, token: data.token, user: profile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Сетевая ошибка при авторизации' };
  }
};

/**
 * Member access login with Email only (No password needed)
 */
export const loginMember = async (
  email: string,
  projectId: string
): Promise<{
  success: boolean;
  token?: string;
  user?: UserProfile;
  project?: any;
  hasPendingRequest?: boolean;
  error?: string;
}> => {
  try {
    const res = await fetch('/api/auth/member-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), projectId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        hasPendingRequest: data.hasPendingRequest,
        error: data.error || 'Email не найден в списке участников этого проекта',
      };
    }

    const role: UserRole = data.user.role || 'client';
    const profile: UserProfile = {
      id: `mem-${data.user.email}`,
      name: data.user.name || data.user.email.split('@')[0],
      email: data.user.email,
      avatar: '',
      role,
      roleTitle:
        role === 'team'
          ? data.user.isAdmin ? 'Администратор' : 'Команда (Редактор)'
          : role === 'contractor'
          ? 'Поставщик / Подрядчик'
          : 'Заказчик дизайн-проекта',
      isGoogleUser: false,
    };

    setStoredToken(data.token);
    setStoredUser(profile);

    // Save remembered email for this specific project
    if (typeof window !== 'undefined') {
      localStorage.setItem(`complspec_email_${projectId}`, email.trim().toLowerCase());
    }

    return { success: true, token: data.token, user: profile, project: data.project };
  } catch (err: any) {
    return { success: false, error: err.message || 'Ошибка входа по email' };
  }
};

/**
 * Check existing session validity
 */
export const checkSession = async (): Promise<AuthSessionResponse> => {
  const token = getStoredToken();
  if (!token) return { valid: false };

  try {
    const res = await fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.valid && data.user) {
      return { valid: true, user: data.user };
    }
    removeStoredToken();
    return { valid: false };
  } catch {
    return { valid: false };
  }
};

/**
 * Logout
 */
export const logoutAuth = async (): Promise<void> => {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  removeStoredToken();
};

/**
 * Submit guest access request
 */
export const submitAccessRequest = async (
  projectId: string,
  data: {
    email: string;
    name: string;
    requestedRole: 'client' | 'contractor';
    message?: string;
  }
): Promise<{ success: boolean; request?: any; error?: string }> => {
  try {
    const res = await fetch(`/api/projects/${projectId}/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Не удалось отправить заявку' };
    }
    return { success: true, request: result.request };
  } catch (err: any) {
    return { success: false, error: err.message || 'Сетевая ошибка' };
  }
};

/**
 * Fetch pending and reviewed access requests for project (Admin only)
 */
export const fetchAccessRequests = async (projectId: string): Promise<any[]> => {
  try {
    const res = await fetch(`/api/projects/${projectId}/access-requests`);
    const data = await res.json();
    return data.success && Array.isArray(data.requests) ? data.requests : [];
  } catch {
    return [];
  }
};

/**
 * Admin review access request
 */
export const reviewAccessRequest = async (
  projectId: string,
  requestId: string,
  action: 'approve' | 'reject',
  role?: UserRole
): Promise<{ success: boolean; member?: any; error?: string }> => {
  try {
    const res = await fetch(`/api/projects/${projectId}/access-requests/${requestId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, role }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Ошибка обработки заявки' };
    }
    return { success: true, member: data.member };
  } catch (err: any) {
    return { success: false, error: err.message || 'Сетевая ошибка' };
  }
};

/**
 * Fetch minimal public project info for guest welcome page
 */
export const fetchPublicProjectInfo = async (projectId: string): Promise<any | null> => {
  try {
    const res = await fetch(`/api/projects/${projectId}/public`);
    const data = await res.json();
    if (res.ok && data.success) {
      return data.project;
    }
    return null;
  } catch {
    return null;
  }
};
