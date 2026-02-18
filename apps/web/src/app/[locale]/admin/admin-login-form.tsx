"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Server sets the httpOnly cookie — refresh triggers server component re-render
        router.refresh();
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center font-display text-2xl font-bold text-text">
          Admin Console
        </h1>
        <p className="mb-8 text-center text-sm text-text-3">
          Superteam Academy
        </p>
        {error && (
          <div className="mb-4 rounded-md border border-danger bg-danger-light p-3 text-sm text-danger">
            {error}
          </div>
        )}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            required
            className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-text transition-all placeholder:text-text-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-bg"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 font-display font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
