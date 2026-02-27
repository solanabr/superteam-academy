"use client";

import { useState, useEffect } from "react";
import { seasonalEvents, type SeasonalEvent } from "@/lib/data/seasonal-events";

export function useSeasonalEvent() {
  const [activeEvent, setActiveEvent] = useState<SeasonalEvent | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    function check() {
      const now = Date.now();
      const event = seasonalEvents.find((e) => {
        const start = new Date(e.startDate).getTime();
        const end = new Date(e.endDate).getTime();
        return now >= start && now <= end;
      });

      if (event) {
        setActiveEvent(event);
        setTimeRemaining(new Date(event.endDate).getTime() - now);
      } else {
        setActiveEvent(null);
        setTimeRemaining(0);
      }
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  return { activeEvent, timeRemaining };
}
