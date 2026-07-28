"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WalletNameGenerator } from "@/components/profile/wallet-name-generator";
import type { Json } from "@/lib/supabase/types";

interface NameRevealDialogProps {
  isLoading: boolean;
  userId: string;
  username: string;
  nameRerollsUsed: number;
}

/** The durable "this learner has finished the name reveal" marker (#843). */
export const NAME_REVEAL_PREF_KEY = "nameRevealSeen";
/** Per-browser fast path; never authoritative on its own. */
const LOCAL_KEY = "nameRevealSeen";

function toPrefsObject(prefs: unknown): Record<string, unknown> {
  return prefs && typeof prefs === "object" && !Array.isArray(prefs)
    ? (prefs as Record<string, unknown>)
    : {};
}

/**
 * Name reveal modal — shown once, to learners who have never completed it.
 *
 * "Completed" is recorded in `profiles.prefs.nameRevealSeen` (#843). It used to
 * rest on two signals that both fail for the most common path — a learner who
 * accepts the generated name without rerolling:
 *
 *   - `name_rerolls_used === 0` never advances for them, so the server keeps
 *     reading "never seen" forever; and
 *   - `localStorage` is per-browser, so another device, a cleared profile or a
 *     private window all re-prompted.
 *
 * `prefs` is the learner-owned JSONB store (own-row UPDATE RLS, bounded by
 * `chk_profiles_prefs_object` / `chk_profiles_prefs_size`) already used for
 * `prefs.nextLesson`. `name_rerolls_used` is deliberately NOT reused as the
 * marker: confirming without rerolling would have to increment it, silently
 * spending one of the learner's rerolls to record an unrelated fact.
 */
export function NameRevealDialog({
  isLoading,
  userId,
  username,
  nameRerollsUsed,
}: NameRevealDialogProps) {
  const [showNameReveal, setShowNameReveal] = useState(false);
  const [dashboardUsername, setDashboardUsername] = useState(username);
  const [prefs, setPrefs] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (isLoading || !userId) return;
    // The local flag alone can suppress, never reveal — it is the offline fast
    // path for a learner who already confirmed in THIS browser.
    if (localStorage.getItem(LOCAL_KEY)) return;

    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("prefs")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;

      const prefsObj = toPrefsObject(data?.prefs);
      setPrefs(prefsObj);

      // Fail CLOSED on a read error: showing a stranger's name picker to
      // someone who already named themselves is the bug being fixed, and a
      // learner who never sees it can still rename from Settings.
      if (error) return;
      if (prefsObj[NAME_REVEAL_PREF_KEY] === true) {
        localStorage.setItem(LOCAL_KEY, "1");
        return;
      }
      if (nameRerollsUsed !== 0) return;
      setShowNameReveal(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, nameRerollsUsed, userId]);

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

  const handleNameConfirm = () => {
    localStorage.setItem(LOCAL_KEY, "1");
    setShowNameReveal(false);

    // Merge, never replace — `prefs` also carries `nextLesson`. Best-effort:
    // the local flag already closed it for this browser, and a failed write
    // just means the modal is re-evaluated on the next device.
    const nextPrefs = { ...prefs, [NAME_REVEAL_PREF_KEY]: true };
    setPrefs(nextPrefs);
    void createClient()
      .from("profiles")
      .update({ prefs: nextPrefs as unknown as Json })
      .eq("id", userId);
  };

  return (
    <Dialog open={showNameReveal} onOpenChange={handleNameConfirm}>
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
