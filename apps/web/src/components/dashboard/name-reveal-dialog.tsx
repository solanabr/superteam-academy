"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WalletNameGenerator } from "@/components/profile/wallet-name-generator";

interface NameRevealDialogProps {
  isLoading: boolean;
  userId: string;
  username: string;
  nameRerollsUsed: number;
}

/** Narrows the untyped prefs blob to a plain object for reading/merging. */
function toPrefsObject(prefs: unknown): Record<string, unknown> {
  return prefs && typeof prefs === "object" && !Array.isArray(prefs)
    ? (prefs as Record<string, unknown>)
    : {};
}

/**
 * Name reveal modal — shown once per learner, on first login.
 *
 * "Already seen" is decided by `profiles.prefs.nameRevealSeen` (#843) — the
 * durable, cross-device record (learner-owned JSONB, same store as
 * `prefs.nextLesson`). localStorage is only an offline fast path, and
 * `name_rerolls_used === 0` alone proves nothing: accepting the first
 * generated name leaves rerolls at 0 forever.
 */
export function NameRevealDialog({
  isLoading,
  userId,
  username,
  nameRerollsUsed,
}: NameRevealDialogProps) {
  const [showNameReveal, setShowNameReveal] = useState(false);
  const [dashboardUsername, setDashboardUsername] = useState(username);

  useEffect(() => {
    // rerolls > 0 means the learner has been through the reveal already.
    if (isLoading || !userId || nameRerollsUsed !== 0) return;
    // Fast path: this browser already recorded a confirmation.
    if (localStorage.getItem("nameRevealSeen")) return;

    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("prefs")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      // Fail closed: if the prefs read errors we cannot prove "never seen",
      // so don't prompt — a genuinely new learner just sees it next visit.
      if (error || !data) return;
      if (toPrefsObject(data.prefs).nameRevealSeen) {
        // Confirmed on another device — backfill the local fast path.
        localStorage.setItem("nameRevealSeen", "1");
        return;
      }
      setShowNameReveal(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, userId, nameRerollsUsed]);

  // Keep username in sync
  useEffect(() => {
    setDashboardUsername(username);
  }, [username]);

  const handleNameChange = async (
    newName: string,
    newRerollsUsed: number
  ): Promise<boolean> => {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ username: newName, name_rerolls_used: newRerollsUsed })
      .eq("id", userId);
    if (!error) setDashboardUsername(newName);
    return !error;
  };

  /** Real confirmation ("Ship it!") — record it durably, cross-device. */
  const handleNameConfirm = () => {
    localStorage.setItem("nameRevealSeen", "1");
    setShowNameReveal(false);
    // Durable record (#843): re-read prefs and merge so sibling keys (e.g.
    // prefs.nextLesson) are not clobbered. Best-effort — localStorage already
    // covers this browser if the write fails.
    void (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("prefs")
        .eq("id", userId)
        .maybeSingle();
      // Fail closed, mirroring the gating read: without a good read we cannot
      // merge, and writing anyway would clobber sibling prefs keys. Skip the
      // durable write — the localStorage fast path already covers this
      // browser, and another device simply re-prompts.
      if (error) return;
      const prefs = { ...toPrefsObject(data?.prefs), nameRevealSeen: true };
      await supabase
        .from("profiles")
        // A plain JSON object; the merged record lacks the index signature the
        // generated Json type wants, so cast at the boundary.
        .update({ prefs: prefs as unknown as Json })
        .eq("id", userId);
    })();
  };

  /**
   * Bare dismissal (Escape / overlay / X) — NOT a confirmation. Keep only the
   * pre-#843 per-browser localStorage record so this browser stops nagging,
   * but skip the durable write: an accidental Escape must not permanently
   * bury the reveal on every other device.
   */
  const handleDismiss = (open: boolean) => {
    if (open) return;
    localStorage.setItem("nameRevealSeen", "1");
    setShowNameReveal(false);
  };

  return (
    <Dialog open={showNameReveal} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md">
        <div className="py-4">
          <WalletNameGenerator
            currentName={dashboardUsername}
            rerollsUsed={nameRerollsUsed}
            animateOnMount
            onNameChange={handleNameChange}
            onConfirm={handleNameConfirm}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
