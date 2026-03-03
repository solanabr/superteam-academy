"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { identifyUser } from "@/lib/analytics";

let initialized = false;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user, authenticated } = usePrivy();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || initialized) return;

    const init = () => {
      import("posthog-js").then(({ default: posthog }) => {
        const host =
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
        posthog.init(key, {
          api_host: host,
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: false,
          persistence: "localStorage+cookie",
        });
        initialized = true;
      });
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(init);
    } else {
      setTimeout(init, 200);
    }
  }, []);

  // Link user identity when Privy auth resolves
  useEffect(() => {
    if (!authenticated || !user) return;

    const wallet = user.linkedAccounts?.find(
      (a) =>
        a.type === "wallet" && "chainType" in a && a.chainType === "solana",
    );
    const google = user.linkedAccounts?.find((a) => a.type === "google_oauth");

    identifyUser(user.id, {
      wallet: (wallet as { address?: string })?.address ?? null,
      email: (google as { email?: string })?.email ?? null,
      auth_method: wallet ? "wallet" : "social",
    });
  }, [authenticated, user]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return <>{children}</>;
}
