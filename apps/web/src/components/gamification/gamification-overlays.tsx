"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { AchievementPopup } from "@/components/gamification/achievement-popup";
import { CertificatePopup } from "@/components/gamification/certificate-popup";
import { useGamificationEvents } from "@/hooks/use-gamification-events";
import { ToastContainer } from "@/components/ui/toast-container";
import { SurpriseBonusToastListener } from "@/components/gamification/surprise-bonus-toast";
import { QuestRewardToastListener } from "@/components/gamification/quest-reward-toast";
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
      {/* Localizes + shows the LX-B15 surprise-bonus toast (informational tier) */}
      <SurpriseBonusToastListener />
      {/* Localizes + celebrates a granted daily-quest reward, from wherever in
          the app the learner earned it (poll path or Realtime path). */}
      <QuestRewardToastListener />
      {/* Replays anonymously-banked completions once signed in (LX-A4c). */}
      <BankedProgressReplay />
      {/* Copies the anonymous /start intake into the profile on sign-in (LX-A3). */}
      <SegmentSync />
      {!userId ? null : (
        /* Single stacking container for the celebrating popups mounted here —
           Certificate Minted and Achievement Unlocked. (The brand guide's
           three-popup rule also allows an XP-reward popup; the XP reward ships
           as the quest-reward toast instead, mounted outside this container.)
           Nothing else gets a popup: a level-up is visible in the header level
           badge, which recomputes from the live XP counter on every xp-gain
           event (the dashboard identity panel is server-rendered and does NOT
           live-update). */
        <div className="pointer-events-none fixed bottom-4 right-3 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          <CertificatePopup className="pointer-events-auto" />
          <AchievementPopup className="pointer-events-auto" />
        </div>
      )}
    </>
  );
}
