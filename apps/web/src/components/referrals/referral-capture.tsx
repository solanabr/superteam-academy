"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";

/**
 * The ?ref= capture-and-claim loop. No UI.
 *
 * Referral links land ANYWHERE (the landing page, a course page, a lesson QR
 * code), and account creation happens through four different auth flows —
 * so attribution is not attached inside any of them. Instead:
 *
 *   1. CAPTURE: any page load carrying ?ref=<code> stores the code in
 *      localStorage (90-day shelf life — a booth visitor may not sign up on
 *      the spot).
 *   2. CLAIM: once a signed-in user exists, POST the stored code to
 *      /api/referrals/claim. Every guard that matters (write-once, no
 *      self-referral, 7-day account-age window) is server-side in the
 *      claim_referral SECURITY DEFINER fn — this component is a dumb courier.
 *
 * Every claim outcome is terminal (claimed, alreadyReferred, invalidCode…):
 * the stored code is cleared so the claim fires at most once per code. Only a
 * transport/server failure keeps the code for a retry on a later visit.
 */

const STORAGE_KEY = "st-referral";
const SHELF_LIFE_MS = 90 * 24 * 60 * 60 * 1000;
const CODE_SHAPE = /^[a-f0-9]{8}$/;

interface StoredReferral {
  code: string;
  capturedAt: number;
}

function readStored(): StoredReferral | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredReferral>;
    if (
      typeof parsed.code !== "string" ||
      !CODE_SHAPE.test(parsed.code) ||
      typeof parsed.capturedAt !== "number" ||
      Date.now() - parsed.capturedAt > SHELF_LIFE_MS
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { code: parsed.code, capturedAt: parsed.capturedAt };
  } catch {
    return null;
  }
}

export function ReferralCapture() {
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const claiming = useRef(false);

  // 1. Capture. First code wins while one is stored — a later ?ref= visit
  // does not overwrite an earlier referrer's pending claim.
  useEffect(() => {
    const ref = searchParams.get("ref")?.toLowerCase() ?? "";
    if (!CODE_SHAPE.test(ref)) return;
    try {
      if (!readStored()) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ code: ref, capturedAt: Date.now() })
        );
      }
    } catch {
      // Storage unavailable (private mode) — the referral is simply not
      // captured; nothing else on the page depends on it.
    }
  }, [searchParams]);

  // 2. Claim, once a session exists.
  useEffect(() => {
    if (isLoading || !user || claiming.current) return;
    const stored = readStored();
    if (!stored) return;

    claiming.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/referrals/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: stored.code }),
        });
        if (res.ok) {
          // Every 200 outcome is terminal — the code's job is done.
          window.localStorage.removeItem(STORAGE_KEY);
        } else {
          // Server hiccup: keep the code, retry on a future visit.
          claiming.current = false;
        }
      } catch {
        claiming.current = false;
      }
    })();
  }, [user, isLoading]);

  return null;
}
