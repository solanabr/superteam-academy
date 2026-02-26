"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface XPNotificationProps {
  amount: number;
  message?: string;
  onDone?: () => void;
}

export function XPNotification({
  amount,
  message,
  onDone,
}: XPNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={cn(
        "fixed top-20 right-4 z-50 flex items-center gap-2 rounded-lg border bg-card px-4 py-3 shadow-lg transition-all duration-300",
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-8 opacity-0"
      )}
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
        <Zap className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-bold">+{amount} XP</p>
        {message && (
          <p className="text-xs text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
