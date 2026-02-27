"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { adminLogin as adminLoginApi } from "@/lib/services/admin-api";

const STORAGE_KEY = "academy-admin-jwt";

type AdminAuthContextValue = {
  token: string | null;
  isAdminAuthenticated: boolean;
  login: (password: string) => Promise<string | null>;
  logout: () => void;
  loading: boolean;
  error: string | null;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
      if (stored) setTokenState(stored);
    } finally {
      setHydrated(true);
    }
  }, []);

  const setToken = useCallback((value: string | null) => {
    setTokenState(value);
    setError(null);
    if (typeof window !== "undefined") {
      if (value) sessionStorage.setItem(STORAGE_KEY, value);
      else sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(
    async (password: string): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminLoginApi({ password });
        if (res.error) {
          setError(res.error);
          return null;
        }
        if (res.token) {
          setToken(res.token);
          return res.token;
        }
        setError("No token returned");
        return null;
      } catch (e) {
        const msg = (e as Error).message;
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setToken]
  );

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const value: AdminAuthContextValue = {
    token: hydrated ? token : null,
    isAdminAuthenticated: !!token && hydrated,
    login,
    logout,
    loading,
    error,
  };

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    return {
      token: null,
      isAdminAuthenticated: false,
      login: async () => null,
      logout: () => {},
      loading: false,
      error: null,
    };
  }
  return ctx;
}
