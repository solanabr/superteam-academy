// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import {
  Stopwatch,
  elapsedOf,
  formatDuration,
  readStopwatch,
  stopwatchStorageKey,
  writeStopwatch,
} from "../stopwatch";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

const KEY = stopwatchStorageKey("lesson-1");

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-31T12:00:00Z"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  setVisibility("visible");
});

describe("stopwatch — pure helpers", () => {
  it("formats mm:ss and widens to h:mm:ss past an hour", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(9_000)).toBe("00:09");
    expect(formatDuration(65_000)).toBe("01:05");
    expect(formatDuration(59 * 60_000 + 59_000)).toBe("59:59");
    expect(formatDuration(3_600_000)).toBe("1:00:00");
    expect(formatDuration(3_725_000)).toBe("1:02:05");
  });

  it("counts the live segment only while running", () => {
    const now = Date.now();
    expect(elapsedOf({ elapsedMs: 5_000, startedAt: null }, now)).toBe(5_000);
    expect(elapsedOf({ elapsedMs: 5_000, startedAt: now - 2_000 }, now)).toBe(
      7_000
    );
  });

  it("treats absent, malformed, and hostile storage as a fresh watch", () => {
    expect(readStopwatch("lesson-1")).toEqual({
      elapsedMs: 0,
      startedAt: null,
    });
    localStorage.setItem(KEY, "not json");
    expect(readStopwatch("lesson-1")).toEqual({
      elapsedMs: 0,
      startedAt: null,
    });
    localStorage.setItem(KEY, JSON.stringify({ elapsedMs: "many" }));
    expect(readStopwatch("lesson-1")).toEqual({
      elapsedMs: 0,
      startedAt: null,
    });
    // A negative total would run the clock backwards.
    localStorage.setItem(KEY, JSON.stringify({ elapsedMs: -5, startedAt: 1 }));
    expect(readStopwatch("lesson-1").elapsedMs).toBe(0);
  });

  it("round-trips through storage", () => {
    writeStopwatch("lesson-1", { elapsedMs: 42_000, startedAt: null });
    expect(readStopwatch("lesson-1")).toEqual({
      elapsedMs: 42_000,
      startedAt: null,
    });
  });

  it("scopes storage per lesson", () => {
    expect(stopwatchStorageKey("a")).not.toBe(stopwatchStorageKey("b"));
  });
});

describe("Stopwatch — widget", () => {
  function open() {
    fireEvent.click(
      screen.getByRole("button", { name: messages.lesson.stopwatch })
    );
  }

  it("starts collapsed and reveals Start/Reset on click", () => {
    renderWithIntl(<Stopwatch lessonId="lesson-1" />);
    expect(
      screen.queryByRole("button", { name: messages.lesson.stopwatchStart })
    ).toBeNull();

    open();
    expect(
      screen.getByRole("button", { name: messages.lesson.stopwatchStart })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.lesson.stopwatchReset })
    ).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
  });

  it("counts up while running and swaps Start for Pause", () => {
    renderWithIntl(<Stopwatch lessonId="lesson-1" />);
    open();
    fireEvent.click(
      screen.getByRole("button", { name: messages.lesson.stopwatchStart })
    );

    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("00:03");
    expect(
      screen.getByRole("button", { name: messages.lesson.stopwatchPause })
    ).toBeInTheDocument();
  });

  it("banks elapsed time on pause and stops advancing", () => {
    renderWithIntl(<Stopwatch lessonId="lesson-1" />);
    open();
    fireEvent.click(
      screen.getByRole("button", { name: messages.lesson.stopwatchStart })
    );
    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    fireEvent.click(
      screen.getByRole("button", { name: messages.lesson.stopwatchPause })
    );

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("00:04");
    expect(readStopwatch("lesson-1")).toEqual({
      elapsedMs: 4_000,
      startedAt: null,
    });
  });

  it("survives a refresh mid-run, still counting from the right point", () => {
    // A run that started 6s ago with 10s already banked.
    writeStopwatch("lesson-1", {
      elapsedMs: 10_000,
      startedAt: Date.now() - 6_000,
    });

    renderWithIntl(<Stopwatch lessonId="lesson-1" />);
    // The collapsed chip shows the total without being opened.
    expect(
      screen.getByRole("button", { name: messages.lesson.stopwatch })
    ).toHaveTextContent("00:16");
  });

  it("does not count time spent on a hidden tab, and resumes on return", () => {
    renderWithIntl(<Stopwatch lessonId="lesson-1" />);
    open();
    fireEvent.click(
      screen.getByRole("button", { name: messages.lesson.stopwatchStart })
    );
    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    act(() => {
      setVisibility("hidden");
    });
    // Two minutes elsewhere must not land on the learner's clock.
    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(readStopwatch("lesson-1")).toEqual({
      elapsedMs: 5_000,
      startedAt: null,
    });

    act(() => {
      setVisibility("visible");
    });
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("00:07");
  });

  it("leaves a PAUSED watch paused across a hide/show cycle", () => {
    writeStopwatch("lesson-1", { elapsedMs: 8_000, startedAt: null });
    renderWithIntl(<Stopwatch lessonId="lesson-1" />);
    open();

    act(() => {
      setVisibility("hidden");
    });
    act(() => {
      setVisibility("visible");
    });
    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(screen.getByRole("timer")).toHaveTextContent("00:08");
    expect(
      screen.getByRole("button", { name: messages.lesson.stopwatchStart })
    ).toBeInTheDocument();
  });

  it("reset clears both the readout and the persisted state", () => {
    writeStopwatch("lesson-1", { elapsedMs: 30_000, startedAt: null });
    renderWithIntl(<Stopwatch lessonId="lesson-1" />);
    open();
    fireEvent.click(
      screen.getByRole("button", { name: messages.lesson.stopwatchReset })
    );

    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(readStopwatch("lesson-1")).toEqual({
      elapsedMs: 0,
      startedAt: null,
    });
  });

  it("keeps two lessons' watches independent", () => {
    writeStopwatch("lesson-1", { elapsedMs: 30_000, startedAt: null });
    renderWithIntl(<Stopwatch lessonId="lesson-2" />);
    expect(
      screen.getByRole("button", { name: messages.lesson.stopwatch })
    ).not.toHaveTextContent("00:30");
  });
});
