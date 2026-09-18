import { UserRole } from '../types';

/**
 * Returns the reliable base URL of the running application,
 * handling iframes, ports, and custom subpaths.
 */
export const getAppBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const origin =
    window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : window.location.href.split('?')[0].split('#')[0].replace(/\/+$/, '');
  const pathname = window.location.pathname.replace(/\/+$/, '');
  return `${origin}${pathname}`;
};

/**
 * Constructs a robust link for accessing a specific project with an assigned role and optional email.
 */
export const buildRoleLink = (projectId: string, role: UserRole, email?: string): string => {
  const base = getAppBaseUrl();
  const searchParams = new URLSearchParams();
  searchParams.set('project', projectId);
  searchParams.set('role', role);
  if (email && email.trim()) {
    searchParams.set('email', email.trim().toLowerCase());
  }
  return `${base}?${searchParams.toString()}`;
};

/**
 * Copies text to clipboard with dual fallback mechanism:
 * 1. Modern navigator.clipboard API
 * 2. Invisible textarea + document.execCommand('copy') for iframes / sandboxed environments
 */
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;

  // Attempt 1: Modern Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API blocked, using execCommand fallback:', err);
    }
  }

  // Attempt 2: Document execCommand fallback
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) return true;
    } catch (fallbackErr) {
      console.error('execCommand copy fallback failed:', fallbackErr);
    }
  }

  return false;
};

export interface ExtractedUrlParams {
  role: UserRole | null;
  projectId: string | null;
  email: string | null;
}

/**
 * Extracts role, project, and email parameters from both window.location.search
 * and window.location.hash (in case of hash-routing or iframe forwardings).
 */
export const extractUrlParams = (): ExtractedUrlParams => {
  if (typeof window === 'undefined') {
    return { role: null, projectId: null, email: null };
  }

  const parseFromSearchString = (str: string) => {
    const params = new URLSearchParams(str);
    const roleRaw = params.get('role');
    const validRoles: UserRole[] = ['team', 'client', 'contractor'];
    const role = roleRaw && validRoles.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : null;
    const projectId = params.get('project');
    const email = params.get('email');
    return { role, projectId, email };
  };

  // 1. Check standard query params (?project=...&role=...)
  const fromSearch = parseFromSearchString(window.location.search);
  if (fromSearch.role || fromSearch.projectId || fromSearch.email) {
    return fromSearch;
  }

  // 2. Check hash query params (#/?project=... or #?role=...)
  if (window.location.hash && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?'));
    const fromHash = parseFromSearchString(hashQuery);
    if (fromHash.role || fromHash.projectId || fromHash.email) {
      return fromHash;
    }
  }

  return { role: null, projectId: null, email: null };
};
