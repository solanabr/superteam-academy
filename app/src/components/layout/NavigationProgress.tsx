"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(true), 100);
    const hideTimer = setTimeout(() => setLoading(false), 600);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5" aria-hidden="true">
      <div className="h-full bg-primary animate-progress" />
    </div>
  );
}
