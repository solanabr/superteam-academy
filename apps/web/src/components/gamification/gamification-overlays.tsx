"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { AchievementPopup } from "@/components/gamification/achievement-popup";
import { CertificatePopup } from "@/components/gamification/certificate-popup";
import { LevelUpPopup } from "@/components/gamification/level-up-popup";
import { useGamificationEvents } from "@/hooks/use-gamification-events";
import { ToastContainer } from "@/components/ui/toast-container";
import { BankedProgressReplay } from "@/components/lessons/banked-progress-replay";
import { SegmentSync } from "@/components/onboarding/segment-sync";

export function GamificationOverlays() {
  const { userId } = useAuth();

  // Subscribe to Supabase Realtime for gamification popups
  useGamificationEvents(userId ?? undefined);

  return (
    <>
      {/* Toast container always renders — works for auth and non-auth contexts */}
      <ToastContainer />
      {/* Replays anonymously-banked completions once signed in (LX-A4c). */}
      <BankedProgressReplay />
      {/* Copies the anonymous /start intake into the profile on sign-in (LX-A3). */}
      <SegmentSync />
      {!userId ? null : (
        /* Single stacking container for all bottom-right popups */
        <div className="pointer-events-none fixed bottom-4 right-3 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          <CertificatePopup className="pointer-events-auto" />
          <LevelUpPopup className="pointer-events-auto" />
          <AchievementPopup className="pointer-events-auto" />
        </div>
      )}
    </>
  );
}
