"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { XpPopup } from "@/components/gamification/xp-popup";
import { LevelUpOverlay } from "@/components/gamification/level-up-overlay";
import { AchievementPopup } from "@/components/gamification/achievement-popup";
import { CertificatePopup } from "@/components/gamification/certificate-popup";
import { useGamificationEvents } from "@/hooks/use-gamification-events";

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

  if (!userId) return null;

  return (
    <>
      <XpPopup />
      <LevelUpOverlay />
      {/* Celebration popups — stacked in bottom-left above XpPopup */}
      <div className="pointer-events-none fixed bottom-28 left-6 z-50 flex flex-col gap-2">
        <AchievementPopup className="pointer-events-auto" />
        <CertificatePopup className="pointer-events-auto" />
      </div>
    </>
  );
}
