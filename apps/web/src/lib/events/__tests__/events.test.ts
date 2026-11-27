import { describe, it, expect } from "vitest";
import {
  eventAchievementId,
  eventWindowState,
  generateEventCode,
  isEventAchievementId,
  normalizeEventCode,
} from "@/lib/events/events";

// Mirrors events.achievement_id's CHECK and the 32-byte PDA seed limit.
const ACHIEVEMENT_ID = /^event-[a-z0-9-]{1,26}$/;

describe("eventAchievementId", () => {
  it.each([
    "Solana Hackathon São Paulo 2026 — Opening Night Workshop",
    "Breakpoint",
    "🔥🔥🔥",
    "a",
  ])("makes a valid, seed-sized id from %j", (name) => {
    const id = eventAchievementId(name);
    expect(id).toMatch(ACHIEVEMENT_ID);
    expect(new TextEncoder().encode(id).length).toBeLessThanOrEqual(32);
    expect(isEventAchievementId(id)).toBe(true);
  });

  it("keeps a readable slug and never repeats", () => {
    const a = eventAchievementId("Rust Workshop");
    const b = eventAchievementId("Rust Workshop");
    expect(a.startsWith("event-rust-workshop-")).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe("generateEventCode", () => {
  it("makes XXXX-XXXX codes without look-alike characters", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateEventCode();
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
      expect(normalizeEventCode(code)).toBe(code);
    }
  });
});

describe("normalizeEventCode", () => {
  it.each([
    ["abcd-1234", "ABCD-1234"],
    ["  abcd 1234 ", "ABCD1234"],
    ["SOLANA-BR", "SOLANA-BR"],
  ])("reads %j as %j", (input, expected) => {
    expect(normalizeEventCode(input)).toBe(expected);
  });

  it.each(["", "abc", "has_underscore", "x".repeat(33), "drop;table"])(
    "rejects %j",
    (input) => {
      expect(normalizeEventCode(input)).toBeNull();
    }
  );
});

describe("eventWindowState", () => {
  const event = {
    startsAt: "2026-11-12T10:00:00.000Z",
    endsAt: "2026-11-12T18:00:00.000Z",
  };

  it("is upcoming before the window", () => {
    expect(eventWindowState(event, new Date("2026-11-12T09:59:59Z"))).toBe(
      "upcoming"
    );
  });

  it("is live from the first instant up to the last", () => {
    expect(eventWindowState(event, new Date("2026-11-12T10:00:00Z"))).toBe(
      "live"
    );
    expect(eventWindowState(event, new Date("2026-11-12T17:59:59Z"))).toBe(
      "live"
    );
  });

  it("is ended at the closing instant", () => {
    expect(eventWindowState(event, new Date("2026-11-12T18:00:00Z"))).toBe(
      "ended"
    );
  });
});

describe("isEventAchievementId", () => {
  it("tells event awards from course achievements", () => {
    expect(isEventAchievementId("event-breakpoint-ab12c")).toBe(true);
    expect(isEventAchievementId("achievement-first-steps")).toBe(false);
  });
});
