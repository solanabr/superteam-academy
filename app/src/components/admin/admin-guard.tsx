"use client";

import { useWalletCompat } from "@/lib/hooks/use-wallet-compat";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";
import { Shield, Wallet, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

const ADMIN_WALLETS = process.env.NEXT_PUBLIC_ADMIN_WALLETS
  ? process.env.NEXT_PUBLIC_ADMIN_WALLETS.split(",").map((w) => w.trim())
  : null;

export interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { publicKey, connected } = useWalletCompat();
  const { authenticated } = usePrivy();
  const t = useTranslations("admin");
  const [apiAdminResult, setApiAdminResult] = useState<{ checked: boolean; isAdmin: boolean }>({ checked: false, isAdmin: false });

  const isAuthenticated = connected || authenticated;

  const syncAdminResult = useMemo<{ resolved: boolean; isAdmin: boolean }>(() => {
    if (!isAuthenticated) return { resolved: true, isAdmin: false };
    if (connected && publicKey && ADMIN_WALLETS) {
      return { resolved: true, isAdmin: ADMIN_WALLETS.includes(publicKey.toBase58()) };
    }
    if (!authenticated) {
      return { resolved: true, isAdmin: false };
    }
    return { resolved: false, isAdmin: false };
  }, [isAuthenticated, connected, publicKey, authenticated]);

  useEffect(() => {
    if (syncAdminResult.resolved) return;
    let cancelled = false;
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setApiAdminResult({ checked: true, isAdmin: data.isAdmin === true });
      })
      .catch(() => {
        if (!cancelled) setApiAdminResult({ checked: true, isAdmin: false });
      });
    return () => { cancelled = true; };
  }, [syncAdminResult.resolved]);

  const checking = !syncAdminResult.resolved && !apiAdminResult.checked;
  const isAdmin = syncAdminResult.resolved ? syncAdminResult.isAdmin : apiAdminResult.isAdmin;

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LogIn className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t("authRequired")}</h1>
          <p className="mt-2 text-muted-foreground">{t("authRequiredDescription")}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-st-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-st-green/90"
          >
            <Wallet className="h-4 w-4" />
            {t("goToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">{t("accessDenied")}</h1>
          <p className="mt-2 text-muted-foreground">{t("accessDeniedDescription")}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
          >
            {t("goToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
