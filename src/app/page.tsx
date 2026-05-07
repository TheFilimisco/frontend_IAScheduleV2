"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEV_BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

export default function LoginPage() {
  const { login, loginAsMock, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(email, password);
    // Redirect is handled inside useAuth.login based on user.role
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dfdfdf]">
      <div className="bg-[#222222] p-10 rounded-xl shadow-2xl w-[400px] flex flex-col items-center">
        <h1 className="text-white text-2xl font-bold mb-8">Company Name</h1>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <Input
            id="login-email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            disabled={isLoading}
            className="bg-white text-black border-none rounded-full h-12 px-6 focus-visible:ring-0"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
          />
          <Input
            id="login-password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
            disabled={isLoading}
            className="bg-white text-black border-none rounded-full h-12 px-6 focus-visible:ring-0"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
          />

          {/* Error message */}
          {error && (
            <p className="text-red-400 text-sm text-center -mb-2 animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}

          <Button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="bg-white text-black hover:bg-gray-200 rounded-full h-12 mt-4 font-semibold text-lg disabled:opacity-60"
          >
            {isLoading ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        {/* ── Dev bypass (only visible when NEXT_PUBLIC_BYPASS_AUTH=true) ── */}
        {DEV_BYPASS && (
          <div className="w-full mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-px bg-gray-600" />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                Dev bypass
              </span>
              <div className="flex-1 h-px bg-gray-600" />
            </div>
            <button
              id="bypass-admin"
              onClick={() => loginAsMock("admin")}
              className="w-full rounded-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Entrar como Admin
            </button>
            <button
              id="bypass-employee"
              onClick={() => loginAsMock("employee")}
              className="w-full rounded-full h-10 text-sm font-semibold bg-gray-600 hover:bg-gray-500 text-white transition-colors"
            >
              Entrar como Empleado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
