"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  CheckCircle,
  WarningCircle,
  XCircle,
  Info,
  X,
} from "@phosphor-icons/react";
import { TOAST_STYLES } from "@/lib/styles/styleClasses";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  uid: number;
  message: string;
  variant: ToastVariant;
}

const DISMISS_MS = 5000;

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: WarningCircle,
  info: Info,
} as const;

// Module-level ref — `dispatchToast` pushes directly into the mounted
// component's state setter, bypassing custom events entirely.
let pushToast: ((item: ToastItem) => void) | null = null;

/** Fire from anywhere to show a toast notification. */
export function dispatchToast(
  message: string,
  variant: ToastVariant = "info"
): void {
  const uid = Date.now() + Math.random();
  if (pushToast) {
    pushToast({ uid, message, variant });
  } else {
    // Fallback: queue until container mounts
    pending.push({ uid, message, variant });
  }
}

const pending: ToastItem[] = [];

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const addToast = useCallback((item: ToastItem) => {
    setToasts((prev) => [...prev, item]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.uid !== item.uid));
      timers.current.delete(item.uid);
    }, DISMISS_MS);
    timers.current.set(item.uid, timer);
  }, []);

  // Register module-level ref on mount, flush any pending toasts
  useEffect(() => {
    pushToast = addToast;
    for (const item of pending) addToast(item);
    pending.length = 0;
    return () => {
      pushToast = null;
    };
  }, [addToast]);

  const dismiss = useCallback((uid: number) => {
    setToasts((prev) => prev.filter((t) => t.uid !== uid));
    const timer = timers.current.get(uid);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(uid);
    }
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-xs flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const Icon = iconMap[t.variant];
        return (
          <div
            key={t.uid}
            className={`pointer-events-auto shadow-lg ${TOAST_STYLES[t.variant]}`}
            style={{
              animation: "pop-spring 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <Icon size={15} weight="fill" aria-hidden="true" />
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.uid)}
              className="ml-auto shrink-0 opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <X size={12} weight="bold" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
