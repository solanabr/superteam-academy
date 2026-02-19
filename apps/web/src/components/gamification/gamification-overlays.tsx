"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { XpPopup } from "@/components/gamification/xp-popup";
import { LevelUpOverlay } from "@/components/gamification/level-up-overlay";
import { AchievementPopup } from "@/components/gamification/achievement-popup";
import { CertificatePopup } from "@/components/gamification/certificate-popup";

export function GamificationOverlays() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setShow(!!session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setShow(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!show) return null;

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
