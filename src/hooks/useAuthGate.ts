"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { buildAuthHref, sanitizeReturnTo } from "@/lib/authRouting";

export function useAuthGate() {
  const { data: session, status } = useSession();
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";

  const isLoggedIn = Boolean(session) || connected;
  const hasWallet = Boolean(connected && publicKey);
  const canOnchainAct = hasWallet;
  const isChecking = status === "loading";

  const currentRoute = useMemo(() => {
    return sanitizeReturnTo(pathname, locale);
  }, [pathname, locale]);

  function redirectToAuth(returnTo?: string) {
    const target = sanitizeReturnTo(returnTo ?? currentRoute, locale);
    router.replace(buildAuthHref(locale, target));
  }

  return {
    isLoggedIn,
    hasWallet,
    canOnchainAct,
    isChecking,
    locale,
    currentRoute,
    redirectToAuth,
  };
}

