"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * AuthProvider — mounts once at the root layout.
 * Reads the persisted token from localStorage and validates it
 * against /auth/me so the session is restored on page refresh.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const rehydrate = useAuthStore((s) => s.rehydrate);

  useEffect(() => {
    rehydrate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
