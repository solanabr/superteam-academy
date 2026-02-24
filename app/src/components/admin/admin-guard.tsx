"use client";

import { type ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/lib/hooks/use-admin";

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const t = useTranslations("admin");
  const { isAdmin, loading, login } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] mb-6">
          <Loader2 className="h-7 w-7 text-[var(--c-text-2)] animate-spin" />
        </div>
        <p className="text-sm text-[var(--c-text-2)] font-mono tracking-wider uppercase">
          {t("verifyingAccess")}
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!password.trim()) return;
      setSubmitting(true);
      setError(null);
      const ok = await login(password);
      if (!ok) {
        setError(t("invalidPassword"));
      }
      setSubmitting(false);
    };

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="flex h-16 w-16 items-center justify-center rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] mx-auto mb-6">
            <KeyRound className="h-7 w-7 text-[#00FFA3]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--c-text)] text-center mb-2">
            {t("adminAccess")}
          </h2>
          <p className="text-sm text-[var(--c-text-2)] text-center mb-6">
            {t("enterPassword")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password")}
              autoFocus
              className="w-full h-10 rounded-[2px] bg-[var(--c-bg)] border border-[var(--c-border-subtle)] px-3 text-sm text-[var(--c-text)] font-mono placeholder:text-[var(--c-text-dim)] focus:outline-none focus:border-[#00FFA3] focus:ring-1 focus:ring-[#00FFA3]"
            />
            {error && (
              <p className="text-xs text-[#EF4444]">{error}</p>
            )}
            <Button
              type="submit"
              disabled={submitting || !password.trim()}
              className="w-full gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {submitting ? t("verifying") : t("unlock")}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
