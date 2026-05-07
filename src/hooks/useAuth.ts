import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * useAuth — clean hook for consuming auth state and actions.
 *
 * Usage:
 *   const { user, isAdmin, login, logout, isLoading, error } = useAuth();
 */
export function useAuth() {
  const router = useRouter();
  const store = useAuthStore();

  // ── Computed helpers ──────────────────────────────────────────────────────
  const isAuthenticated = store.token !== null && store.user !== null;
  const isAdmin         = store.user?.role === 'admin';
  const isEmployee      = store.user?.role === 'employee';

  // ── Login with redirect ───────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      await store.login(email, password);

      // After store.login resolves, check for errors before redirecting
      const { error, user } = useAuthStore.getState();
      if (error || !user) return; // stay on login page — error shown by UI

      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/employee');
      }
    },
    [store, router]
  );

  // ── Logout with redirect ──────────────────────────────────────────────────
  const logout = useCallback(() => {
    store.logout();
    router.push('/');
  }, [store, router]);

  // ── Mock login (dev bypass) ─────────────────────────────────────────
  const loginAsMock = useCallback(
    (role: 'admin' | 'employee') => {
      store.loginAsMock(role);
      router.push(role === 'admin' ? '/admin' : '/employee');
    },
    [store, router]
  );

  return {
    // State
    user:           store.user,
    linkedEmployee: store.linkedEmployee,
    token:          store.token,
    isLoading:      store.isLoading,
    error:          store.error,

    // Computed
    isAuthenticated,
    isAdmin,
    isEmployee,

    // Actions
    login,
    loginAsMock,
    logout,
    rehydrate:  store.rehydrate,
    clearError: store.clearError,
  };
}
