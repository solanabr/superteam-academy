"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface ShortcutRow {
  keys: string[];
  description: string;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-semibold text-muted-foreground">
      {children}
    </kbd>
  );
}

function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

const SHORTCUTS: ShortcutRow[] = [
  { keys: ["Ctrl/Cmd", "K"], description: "Focus search" },
  { keys: ["Ctrl/Cmd", "Enter"], description: "Run code (challenge editor)" },
  { keys: ["Ctrl/Cmd", "S"], description: "Save progress (challenge editor)" },
  { keys: ["Escape"], description: "Close modal / dialog" },
  { keys: ["N"], description: "Next lesson" },
  { keys: ["P"], description: "Previous lesson" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  // Lazy init: runs only on client, no SSR mismatch for a dialog that is never pre-rendered
  const [mac] = useState(() => isMac());

  const rows = useMemo(
    () =>
      SHORTCUTS.map((s) => ({
        ...s,
        keys: s.keys.map((k) =>
          mac ? k.replace("Ctrl/Cmd", "Cmd") : k.replace("Ctrl/Cmd", "Ctrl")
        ),
      })),
    [mac]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" closeLabel="Close">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {row.keys.map((k, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {j < row.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 text-muted-foreground">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Drop this anywhere in the app tree (e.g. in layout) to register the "?" shortcut
 * and render the dialog globally.
 */
export function GlobalKeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  const shortcuts = useMemo(
    () => [
      {
        key: "?",
        description: "Show keyboard shortcuts",
        handler: () => setOpen(true),
        skipWhenTyping: true,
      },
    ],
    []
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />
  );
}
