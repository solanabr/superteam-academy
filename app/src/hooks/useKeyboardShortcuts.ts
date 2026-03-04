"use client";

import { useEffect, useRef, useLayoutEffect } from "react";

export interface ShortcutHandler {
  /** Key to match (case-insensitive). Use "?" for question mark. */
  key: string;
  /** Require Ctrl or Cmd (metaKey on Mac) */
  ctrl?: boolean;
  /** Require shift */
  shift?: boolean;
  /** Description shown in the shortcuts dialog */
  description: string;
  /** Callback to invoke */
  handler: () => void;
  /**
   * Whether to skip the shortcut when user is typing in an input/textarea/select/contenteditable.
   * Defaults to true. Set to false to always fire (e.g. Ctrl+Enter in Monaco).
   */
  skipWhenTyping?: boolean;
}

/**
 * Registers global keyboard shortcuts.
 * Safe to call with an inline array — uses a ref updated in useLayoutEffect
 * so the listener is never re-registered on re-renders.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  const shortcutsRef = useRef<ShortcutHandler[]>([]);

  // Sync shortcuts into ref before effects fire (layout phase, before paint)
  useLayoutEffect(() => {
    shortcutsRef.current = shortcuts;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl
          ? e.ctrlKey || e.metaKey
          : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

        if (keyMatch && ctrlMatch && shiftMatch) {
          const skipWhenTyping = shortcut.skipWhenTyping !== false;
          if (skipWhenTyping && isTyping) continue;
          e.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // Empty deps: register once per mount. shortcutsRef is synced via useLayoutEffect.
  }, []);
}
