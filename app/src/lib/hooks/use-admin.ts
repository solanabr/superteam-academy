"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect, useCallback } from "react";

export function useAdmin() {
  const { publicKey, connected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const walletAddress = publicKey?.toBase58() ?? null;

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      setIsAdmin(data.authenticated === true);
    } catch {
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.authenticated) {
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch {
      // ignore
    }
    setIsAdmin(false);
  }, []);

  return { isAdmin, loading, walletAddress, connected, login, logout };
}
