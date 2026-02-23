"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  dismissing?: boolean;
}

const variantBorder: Record<ToastVariant, string> = {
  success: "border-l-[#55E9AB]",
  error: "border-l-[#EF4444]",
  info: "border-l-[#03E1FF]",
  warning: "border-l-[#F59E0B]",
};

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex items-center gap-3 w-full max-w-sm p-4 rounded bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] shadow-[0_8px_32px_rgba(0,0,0,0.6)] border-l-4",
        variantBorder[toast.variant],
        toast.dismissing ? "animate-slide-out" : "animate-slide-in",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--c-text)]">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-1 text-xs text-[var(--c-text-2)]">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
