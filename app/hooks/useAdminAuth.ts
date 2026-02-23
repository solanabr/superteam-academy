"use client";

import { useState } from "react";
import { adminLogin, generateApiKey } from "@/lib/services/admin-api";

export function useAdminLogin() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin({ password });
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
  };

  const logout = () => {
    setToken(null);
    setError(null);
  };

  return { login, logout, token, loading, error };
}

export function useGenerateApiKey() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    apiKey?: string;
    role?: string;
    label?: string;
    error?: string;
  } | null>(null);

  const generate = async (
    jwt: string,
    params: { role: "admin" | "client"; label?: string }
  ) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await generateApiKey(jwt, params);
      if (res.error) {
        setResult({ error: res.error });
        return null;
      }
      setResult({
        apiKey: res.apiKey,
        role: res.role,
        label: res.label,
      });
      return res.apiKey ?? null;
    } catch (e) {
      const msg = (e as Error).message;
      setResult({ error: msg });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clear = () => setResult(null);

  return { generate, result, loading, clear };
}
