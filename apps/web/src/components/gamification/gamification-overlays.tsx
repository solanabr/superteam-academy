"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { LevelUpOverlay } from "@/components/gamification/level-up-overlay";
import { AchievementPopup } from "@/components/gamification/achievement-popup";
import { CertificatePopup } from "@/components/gamification/certificate-popup";
import { useGamificationEvents } from "@/hooks/use-gamification-events";
import { ToastContainer } from "@/components/ui/toast-container";

export function GamificationOverlays() {
  const { userId } = useAuth();

  // Subscribe to Supabase Realtime for gamification popups
  useGamificationEvents(userId ?? undefined);

  return (
    <>
      {/* Toast container always renders — works for auth and non-auth contexts */}
      <ToastContainer />
      {!userId ? null : (
        /* Single stacking container for all bottom-right popups */
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          <LevelUpOverlay className="pointer-events-auto" />
          <CertificatePopup className="pointer-events-auto" />
          <AchievementPopup className="pointer-events-auto" />
        </div>
      )}
    </>
  );
}
