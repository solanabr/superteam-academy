"use client";

import { useState } from "react";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { generateApiKey } from "@/lib/services/admin-api";

export function useAdminLogin() {
  return useAdminAuth();
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
