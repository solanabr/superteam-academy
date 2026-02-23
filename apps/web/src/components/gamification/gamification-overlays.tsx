"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { XpPopup } from "@/components/gamification/xp-popup";
import { LevelUpOverlay } from "@/components/gamification/level-up-overlay";
import { AchievementPopup } from "@/components/gamification/achievement-popup";
import { CertificatePopup } from "@/components/gamification/certificate-popup";
import { useGamificationEvents } from "@/hooks/use-gamification-events";
import { ToastContainer } from "@/components/ui/toast-container";

export function GamificationOverlays() {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to Supabase Realtime for gamification popups
  useGamificationEvents(userId);

  return (
    <>
      {/* Toast container always renders — works for auth and non-auth contexts */}
      <ToastContainer />
      {!userId ? null : (
        <>
          <LevelUpOverlay />
          {/* Single stacking container for all bottom-right popups */}
          <div className="pointer-events-none fixed bottom-20 right-6 z-50 flex flex-col items-end gap-2">
            <CertificatePopup className="pointer-events-auto" />
            <AchievementPopup className="pointer-events-auto" />
            <XpPopup />
          </div>
        </>
      )}
    </>
  );
}
