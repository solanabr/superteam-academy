"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface XpEvent {
  amount: number;
  id: number;
}

let eventCounter = 0;

export function dispatchXpGain(amount: number): void {
  if (typeof window === "undefined") return;
  eventCounter++;
  window.dispatchEvent(
    new CustomEvent("xp-gain", {
      detail: { amount, id: eventCounter },
    })
  );
}

export function XpPopup({ className }: { className?: string }) {
  const [events, setEvents] = useState<XpEvent[]>([]);

  const handleXpGain = useCallback((e: Event) => {
    const detail = (e as CustomEvent<XpEvent>).detail;
    setEvents((prev) => [...prev, detail]);
    setTimeout(() => {
      setEvents((prev) => prev.filter((ev) => ev.id !== detail.id));
    }, 2500);
  }, []);

  useEffect(() => {
    window.addEventListener("xp-gain", handleXpGain);
    return () => window.removeEventListener("xp-gain", handleXpGain);
  }, [handleXpGain]);

  if (events.length === 0) return null;

  return (
    <div
      className={cn("flex flex-col items-end gap-2", className)}
      aria-live="polite"
    >
      {events.map((ev) => (
        /* v9 .popup-xp — pill card, border-radius: r-full, amber glow */
        <div key={ev.id} className="popup-xp">
          {/* v9 .popup-xp-icon — 34px amber circle */}
          <div className="popup-xp-icon" aria-hidden="true">
            ⚡
          </div>
          {/* v9 .popup-xp-amount — Nunito 900, 20px, --xp */}
          <span className="popup-xp-amount">+{ev.amount} XP</span>
        </div>
      ))}
    </div>
  );
}
