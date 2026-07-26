"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WalletNameGenerator } from "@/components/profile/wallet-name-generator";

interface NameRevealDialogProps {
  isLoading: boolean;
  userId: string;
  username: string;
  nameRerollsUsed: number;
}

/**
 * Name reveal modal — shown on first login (rerolls === 0 means never seen),
 * persisting the "seen" flag in localStorage and username changes in
 * Supabase.
 */
export function NameRevealDialog({
  isLoading,
  userId,
  username,
  nameRerollsUsed,
}: NameRevealDialogProps) {
  const [showNameReveal, setShowNameReveal] = useState(false);
  const [dashboardUsername, setDashboardUsername] = useState(username);

  // Show name reveal modal on first visit (rerolls === 0 means never seen)
  useEffect(() => {
    if (
      !isLoading &&
      nameRerollsUsed === 0 &&
      userId &&
      !localStorage.getItem("nameRevealSeen")
    ) {
      setShowNameReveal(true);
    }
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
    localStorage.setItem("nameRevealSeen", "1");
    setShowNameReveal(false);
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
