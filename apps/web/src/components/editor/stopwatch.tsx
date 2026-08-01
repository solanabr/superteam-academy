"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowCounterClockwise,
  Pause,
  Play,
  Timer,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Persisted stopwatch state. `startedAt` is a wall-clock timestamp and is
 * non-null only while the watch is running, so a refresh mid-run keeps
 * counting from the right point instead of restarting at the banked total.
 */
export interface StopwatchState {
  /** Milliseconds banked by previous run segments. */
  elapsedMs: number;
  /** `Date.now()` when the current segment started, or null when paused. */
  startedAt: number | null;
}

const IDLE: StopwatchState = { elapsedMs: 0, startedAt: null };

export function stopwatchStorageKey(lessonId: string): string {
  return `superteam-lms-stopwatch-${lessonId}`;
}

export function readStopwatch(lessonId: string): StopwatchState {
  try {
    const raw = localStorage.getItem(stopwatchStorageKey(lessonId));
    if (!raw) return IDLE;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return IDLE;
    const { elapsedMs, startedAt } = parsed as Partial<StopwatchState>;
    if (typeof elapsedMs !== "number" || !Number.isFinite(elapsedMs)) {
      return IDLE;
    }
    return {
      elapsedMs: Math.max(0, elapsedMs),
      startedAt:
        typeof startedAt === "number" && Number.isFinite(startedAt)
          ? startedAt
          : null,
    };
  } catch {
    return IDLE;
  }
}

export function writeStopwatch(lessonId: string, state: StopwatchState): void {
  try {
    localStorage.setItem(stopwatchStorageKey(lessonId), JSON.stringify(state));
  } catch {
    // localStorage may be unavailable (private mode, quota)
  }
}

/** Total elapsed time for a state as of `now`, including the live segment. */
export function elapsedOf(state: StopwatchState, now: number): number {
  if (state.startedAt === null) return state.elapsedMs;
  return state.elapsedMs + Math.max(0, now - state.startedAt);
}

/** `mm:ss`, widening to `h:mm:ss` past an hour. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

interface StopwatchProps {
  /** Scopes persistence — the watch is per-lesson and purely personal. */
  lessonId: string;
  className?: string;
}

/**
 * LeetCode-style personal stopwatch for the challenge toolbar. Client-only and
 * unwired from XP or grading: it exists so a learner can time themselves.
 *
 * Collapsed it is a single clock button; opening it reveals the mono readout
 * plus Start/Pause/Reset. A hidden tab pauses accumulation (and resumes it on
 * return if the watch was running), so the number never silently counts time
 * the learner spent elsewhere.
 */
export function Stopwatch({ lessonId, className }: StopwatchProps) {
  const t = useTranslations("lesson");
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<StopwatchState>(IDLE);
  const [now, setNow] = useState(() => Date.now());
  // Whether the watch was running when the tab went hidden, so returning
  // restores the run rather than leaving it silently paused.
  const resumeOnShowRef = useRef(false);

  // Hydrate from storage after mount (SSR has no localStorage, and reading it
  // during render would desync the first paint).
  useEffect(() => {
    setState(readStopwatch(lessonId));
    setNow(Date.now());
  }, [lessonId]);

  const update = useCallback(
    (next: StopwatchState) => {
      setState(next);
      writeStopwatch(lessonId, next);
    },
    [lessonId]
  );

  const isRunning = state.startedAt !== null;

  // Tick only while running — a paused watch needs no timer at all.
  useEffect(() => {
    if (!isRunning) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "hidden") {
        setState((prev) => {
          if (prev.startedAt === null) return prev;
          resumeOnShowRef.current = true;
          const banked = {
            elapsedMs: elapsedOf(prev, Date.now()),
            startedAt: null,
          };
          writeStopwatch(lessonId, banked);
          return banked;
        });
        return;
      }
      if (!resumeOnShowRef.current) return;
      resumeOnShowRef.current = false;
      setState((prev) => {
        if (prev.startedAt !== null) return prev;
        const resumed = { elapsedMs: prev.elapsedMs, startedAt: Date.now() };
        writeStopwatch(lessonId, resumed);
        return resumed;
      });
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [lessonId]);

  const toggle = useCallback(() => {
    update(
      isRunning
        ? { elapsedMs: elapsedOf(state, Date.now()), startedAt: null }
        : { elapsedMs: state.elapsedMs, startedAt: Date.now() }
    );
  }, [isRunning, state, update]);

  const reset = useCallback(() => {
    resumeOnShowRef.current = false;
    update(IDLE);
  }, [update]);

  const elapsed = elapsedOf(state, now);
  const readout = formatDuration(elapsed);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={false}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs tabular-nums text-text-3 transition-colors hover:bg-subtle hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
          className
        )}
        aria-label={t("stopwatch")}
      >
        <Timer size={16} weight="duotone" aria-hidden="true" />
        {elapsed > 0 && <span>{readout}</span>}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border border-border bg-subtle px-1.5 py-0.5",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        aria-expanded
        aria-label={t("stopwatch")}
        className="flex items-center gap-1.5 rounded px-1 py-0.5 font-mono text-xs tabular-nums text-text transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <Timer size={14} weight="duotone" aria-hidden="true" />
        {/* Polite live region: the readout changes twice a second, so only the
            paused/settled value is worth announcing. */}
        <span role="timer" aria-live="off">
          {readout}
        </span>
      </button>
      <button
        type="button"
        onClick={toggle}
        aria-label={isRunning ? t("stopwatchPause") : t("stopwatchStart")}
        className="rounded p-1 text-text-3 transition-colors hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        {isRunning ? (
          <Pause size={13} weight="fill" aria-hidden="true" />
        ) : (
          <Play size={13} weight="fill" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={reset}
        aria-label={t("stopwatchReset")}
        className="rounded p-1 text-text-3 transition-colors hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <ArrowCounterClockwise size={13} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}
