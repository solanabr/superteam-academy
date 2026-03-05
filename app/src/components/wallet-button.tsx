"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Link } from "@/i18n/navigation";
import { User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";

const PROFILE_AVATAR_KEY = "st-academy:profile-avatar";

function getStoredAvatar(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PROFILE_AVATAR_KEY);
  } catch {
    return null;
  }
}

export function WalletButton() {
  const t = useTranslations();
  const { publicKey, connected, login, logout, ready } = useAuth();
  const { isAdmin } = useAdmin();
  const [mounted, setMounted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setAvatarUrl(getStoredAvatar());
    const handler = () => setAvatarUrl(getStoredAvatar());
    const customHandler = (e: CustomEvent<string>) =>
      setAvatarUrl(e.detail || null);
    window.addEventListener("storage", handler);
    window.addEventListener(
      "profile-avatar-change",
      customHandler as EventListener,
    );
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(
        "profile-avatar-change",
        customHandler as EventListener,
      );
    };
  }, []);

  const handleLogin = useCallback(() => {
    try {
      login();
    } catch (err) {
      console.error("[WalletButton] login error:", err);
    }
  }, [login]);

  if (!mounted || !ready) {
    return (
      <div
        className="wallet-button-placeholder h-9 w-9 min-w-[36px] rounded-full bg-[hsl(var(--brand-logo-green))]/20"
        aria-hidden
      />
    );
  }

  if (!connected) {
    return (
      <Button
        type="button"
        onClick={handleLogin}
        className="!h-9 !rounded-xl !px-4 !py-2 !font-semibold !shadow-none bg-[hsl(var(--brand-emerald))] text-white hover:bg-[hsl(153,100%,32%)]"
      >
        {t("common.signIn")}
      </Button>
    );
  }

  const addr = publicKey!.toBase58();
  const initial = addr.charAt(4).toUpperCase() || "?";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[hsl(var(--brand-logo-green))]/50 bg-[hsl(var(--brand-logo-green))]/10 transition-colors hover:bg-[hsl(var(--brand-logo-green))]/20 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-logo-green))]/30 focus:ring-offset-2 focus:ring-offset-[hsl(var(--brand-logo-yellow))]"
          aria-label={t("common.profile")}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-[hsl(var(--brand-logo-green))]">
              {initial}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-[9999] w-44 rounded-xl border-2 border-[hsl(var(--brand-logo-green))] bg-[hsl(var(--brand-logo-yellow))] p-1 shadow-lg"
        >
          {isAdmin && (
            <DropdownMenu.Item asChild>
              <Link
                href="/admin"
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--brand-logo-green))] outline-none transition-colors hover:bg-[hsl(var(--brand-logo-yellow-light))] focus:bg-[hsl(var(--brand-logo-yellow-light))]"
              >
                <Shield className="h-4 w-4" />
                {t("common.admin")}
              </Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item asChild>
            <Link
              href="/settings"
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--brand-logo-green))] outline-none transition-colors hover:bg-[hsl(var(--brand-logo-yellow-light))] focus:bg-[hsl(var(--brand-logo-yellow-light))]"
            >
              <User className="h-4 w-4" />
              {t("common.editProfile")}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-[hsl(var(--brand-logo-yellow-hover))]" />
          <DropdownMenu.Item
            onSelect={() => logout()}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--brand-logo-green))] outline-none transition-colors hover:bg-red-500/20 hover:text-red-700 focus:bg-red-500/20 focus:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            {t("common.disconnect")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
