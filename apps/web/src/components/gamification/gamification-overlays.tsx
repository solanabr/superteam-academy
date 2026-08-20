"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { AchievementPopup } from "@/components/gamification/achievement-popup";
import { CertificatePopup } from "@/components/gamification/certificate-popup";
import { RewardPopupQueue } from "@/components/gamification/reward-popup";
import { useGamificationEvents } from "@/hooks/use-gamification-events";
import { BankedProgressReplay } from "@/components/lessons/banked-progress-replay";
import { SegmentSync } from "@/components/onboarding/segment-sync";

export function GamificationOverlays() {
  const { userId } = useAuth();

  // Subscribe to Supabase Realtime for gamification popups
  useGamificationEvents(userId ?? undefined);

  return (
    <>
      {/* ToastContainer is NOT here (#1097): these overlays mount only on
          (platform) routes, while marketing pages dispatch toasts too (e.g.
          AuthErrorToast on the landing page), so the container renders
          globally in [locale]/layout.tsx instead. */}
      {/* Replays anonymously-banked completions once signed in (LX-A4c). */}
      <BankedProgressReplay />
      {/* Copies the anonymous /start intake into the profile on sign-in (LX-A3). */}
      <SegmentSync />
      {!userId ? null : (
        /* Single stacking container for all bottom-right popups.
           Owner reversal 2026-08-01 (supersedes the brand wave #955/#957): the
           recurring reward moments get popups again, not toasts — level-up,
           daily-quest completion and the surprise bonus all render through
           RewardPopupQueue, which plays them ONE AT A TIME so a lesson
           completion that fires several doesn't bury the moment in a pile.
           The header level badge stays as the ambient signal; the popup is the
           moment, and both firing is intended. */
        <div className="pointer-events-none fixed bottom-4 right-3 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          <CertificatePopup className="pointer-events-auto" />
          <RewardPopupQueue className="pointer-events-auto" />
          <AchievementPopup className="pointer-events-auto" />
        </div>
      )}
    </>
  );
}
