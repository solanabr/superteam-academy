"use client";

import { useAuth } from "@/lib/auth/auth-provider";
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
        /* ONE bottom-right surface.
           Owner reversal 2026-08-01 (supersedes the brand wave #955/#957): the
           recurring reward moments get popups again, not toasts. Choreography
           rework 24-08: level-up, daily-quest completion AND achievement
           unlocks all render through this one surface — the achievement popup
           used to be a second, always-parallel column beside it.

           OWNER REVERSAL 2026-09-18: the 24-08 one-card-at-a-time sequencing is
           gone. Reward cards STACK (newest on top, each with its own beat), and
           the certificate popup no longer defers behind them — it renders
           immediately and sits above the stack, which is why it is first here.
           The header level badge stays as the ambient signal; the popup is the
           moment, and both firing is intended. */
        <div className="pointer-events-none fixed bottom-4 right-3 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          <CertificatePopup className="pointer-events-auto" />
          <RewardPopupQueue className="pointer-events-auto" />
        </div>
      )}
    </>
  );
}
