"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { XpPopup } from "@/components/gamification/xp-popup";
import { LevelUpOverlay } from "@/components/gamification/level-up-overlay";

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
    </>
  );
}
