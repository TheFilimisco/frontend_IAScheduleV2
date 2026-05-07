import { create } from 'zustand';
import type { AuthState, AuthUser, LoginResponse } from '@/types/auth';
import type { Employee } from '@/types/entities';

// Extend AuthState locally to add the mock action
type AuthStateExtended = AuthState & {
  loginAsMock: (role: 'admin' | 'employee') => void;
};

// ─── API helpers ──────────────────────────────────────────────────────────────
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const api = (path: string) => `${API_BASE}${path}`;

const TOKEN_KEY = 'ias_token';

// ─── Cookie helpers (readable by Edge middleware) ─────────────────────────────
function setRoleCookie(role: string) {
  // Session cookie — expires when browser closes
  document.cookie = `ias_role=${role}; path=/; SameSite=Strict`;
}
function clearRoleCookie() {
  document.cookie = 'ias_role=; path=/; max-age=0; SameSite=Strict';
}

// ─── Helper: fetch the Employee doc linked to this user ───────────────────────
async function fetchLinkedEmployee(employeeId: string, token: string): Promise<Employee | null> {
  try {
    const res = await fetch(api(`/api/employees/${employeeId}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Auth Store ───────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthStateExtended>((set, get) => ({
  token: null,
  user: null,
  linkedEmployee: null,
  isLoading: false,
  error: null,

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(api('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse & { message?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? 'Login failed');
      }

      // Persist token so it survives page refresh
      localStorage.setItem(TOKEN_KEY, data.token);
      // Set lightweight cookie for Edge middleware route protection
      setRoleCookie(data.user.role);

      // If this user has a linked Employee doc, fetch it
      let linkedEmployee: Employee | null = null;
      if (data.user.employeeId) {
        linkedEmployee = await fetchLinkedEmployee(data.user.employeeId, data.token);
      }

      set({
        token: data.token,
        user: data.user,
        linkedEmployee,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message ?? 'Unknown error' });
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    clearRoleCookie();
    set({ token: null, user: null, linkedEmployee: null, error: null });
  },

  // ── Rehydrate (call once on app mount) ────────────────────────────────────
  // Reads the token from localStorage, validates it against /auth/me,
  // and restores the session if it is still valid.
  rehydrate: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    set({ isLoading: true });
    try {
      const res = await fetch(api('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Token expired or invalid — clean up silently
        localStorage.removeItem(TOKEN_KEY);
        set({ isLoading: false });
        return;
      }

      const user: AuthUser = await res.json();

      let linkedEmployee: Employee | null = null;
      if (user.employeeId) {
        linkedEmployee = await fetchLinkedEmployee(user.employeeId, token);
      }

      // Ensure the cookie is still set (e.g. after a hard refresh)
      setRoleCookie(user.role);
      set({ token, user, linkedEmployee, isLoading: false });
    } catch {
      // Network error on startup — keep the token, try again later
      set({ token, isLoading: false });
    }
  },

  // ── Clear error ────────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),

  // ── Mock login (dev only — no backend required) ─────────────────────────
  loginAsMock: (role) => {
    const mockUser: AuthUser = {
      id:    `mock-${role}-001`,
      code:  role === 'admin' ? 'ADM-0001' : 'EMP-JUCA-001',
      email: role === 'admin' ? 'admin@mock.dev' : 'employee@mock.dev',
      role,
    };
    const mockEmployee = role === 'employee' ? {
      id:          'mock-emp-1',
      code:        'EMP-JUCA-001',
      firstName:   'Juan',
      lastName:    'Carlos',
      departmentId: 'mock-dept-1',
      role:        'employee',
      status:      'active',
    } : null;

    setRoleCookie(role);
    set({
      token:          'mock-token',
      user:           mockUser,
      linkedEmployee: mockEmployee,
      isLoading:      false,
      error:          null,
    });
  },
}));
