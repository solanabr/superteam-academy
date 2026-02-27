"use client";

import React, { useState, useEffect } from "react";
import { GuidedTour } from "./guided-tour";

const TOUR_KEY = "sa-show-tour";

export function setTourFlag() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(TOUR_KEY, "1");
  }
}

export function TourTrigger() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const flag = sessionStorage.getItem(TOUR_KEY);
    if (flag === "1") {
      sessionStorage.removeItem(TOUR_KEY);
      // Delay so the destination page renders first
      const timer = setTimeout(() => setShowTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showTour) return null;

  return <GuidedTour onComplete={() => setShowTour(false)} />;
}
