import { UserRole } from '../types';

export interface SessionUser {
  email: string;
  role: UserRole;
  isAdmin: boolean;
  projectId?: string;
}

export const checkSession = async (): Promise<SessionUser | null> => {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.user) {
      return data.user;
    }
  } catch {
    // ignore
  }
  return null;
};

export const adminLogin = async (email: string, password: string): Promise<{ success: boolean; user?: SessionUser; error?: string }> => {
  const res = await fetch('/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.success) return { success: true, user: data.user };
  return { success: false, error: data.error };
};

export const memberLogin = async (email: string, projectId: string): Promise<{ success: boolean; user?: SessionUser; error?: string }> => {
  const res = await fetch('/api/auth/member-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, projectId }),
  });
  const data = await res.json();
  if (data.success) return { success: true, user: data.user };
  return { success: false, error: data.error };
};

export const logout = async (): Promise<void> => {
  await fetch('/api/auth/logout', { method: 'POST' });
};

export const requestProjectAccess = async (projectId: string, email: string): Promise<{ success: boolean; error?: string }> => {
  const res = await fetch(`/api/projects/${projectId}/request-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  return { success: data.success, error: data.error };
};

export const getAccessRequests = async (projectId: string) => {
  const res = await fetch(`/api/projects/${projectId}/requests`, { cache: 'no-store' });
  const data = await res.json();
  return data.success ? data.requests : [];
};

export const approveAccessRequest = async (projectId: string, requestId: string, role: UserRole) => {
  const res = await fetch(`/api/projects/${projectId}/requests/${requestId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  return res.json();
};

export const rejectAccessRequest = async (projectId: string, requestId: string) => {
  const res = await fetch(`/api/projects/${projectId}/requests/${requestId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
};
