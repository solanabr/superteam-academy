"use client";

import { toast } from "sonner";

export function XPToastContent({ amount }: { amount: number }) {
  return (
    <div className="xp-toast-container flex items-center gap-2">
      <div className="xp-toast-icon flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
        <span className="text-sm font-bold text-secondary">XP</span>
      </div>
      <span className="xp-toast-text text-lg font-bold text-secondary">
        +{amount} XP
      </span>
    </div>
  );
}

export function showXPToast(amount: number) {
  toast.custom(
    () => (
      <div role="status" aria-live="polite" className="xp-toast-float pointer-events-auto rounded-xl border border-secondary/30 bg-background/90 px-4 py-3 shadow-[0_0_20px_hsl(var(--secondary)/0.3),0_0_40px_hsl(var(--secondary)/0.1)] backdrop-blur-md">
        <XPToastContent amount={amount} />
      </div>
    ),
    {
      duration: 2500,
      position: "top-center",
    }
  );
}
