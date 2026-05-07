import type { Employee } from './entities';

// ─── Auth Types ───────────────────────────────────────────────────────────────

/** Mirrors backend User.toJSON() output — password is never included */
export type AuthUser = {
  id: string;
  code: string;
  email: string;
  role: 'admin' | 'employee';
  employeeId?: string;        // ObjectId ref to Employee collection
  lastLogin?: string;
};

/** What POST /auth/login returns */
export type LoginResponse = {
  token: string;
  user: AuthUser;
};

/** Auth store shape */
export type AuthState = {
  token: string | null;
  user: AuthUser | null;
  linkedEmployee: Employee | null;  // resolved Employee doc (populated after login)
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  rehydrate: () => Promise<void>;        // reads token from localStorage on mount
  clearError: () => void;
};
