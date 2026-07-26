import { describe, it, expect } from "vitest";
import { generateStreakCalendar, generateWeekCalendar } from "../streaks";

// #573 (LX-B8): the DISPLAY side of streak forgiveness. The freeze DECISION is
// server-authoritative (award_xp / award_community_xp / get_daily_quest_state);
// these helpers only RENDER the frozen days the server logged. What matters here
// is the merge rule: a freeze fills an inactive day as a snowflake, and real
// activity always wins over a freeze flag on the same day.

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0] as string;
}

describe("generateStreakCalendar — freeze merge", () => {
  it("renders an inactive frozen day as frozen, not a hole", () => {
    const frozen = isoDaysAgo(3);
    const cal = generateStreakCalendar({}, 30, [frozen]);
    const cell = cal.find((c) => c.date === frozen)!;
    expect(cell.active).toBe(false);
    expect(cell.frozen).toBe(true);
  });

  it("lets real activity win over a freeze flag on the same day", () => {
    const day = isoDaysAgo(2);
    const cal = generateStreakCalendar({ [day]: 1 }, 30, [day]);
    const cell = cal.find((c) => c.date === day)!;
    expect(cell.active).toBe(true);
    expect(cell.frozen).toBe(false);
  });

  it("leaves ordinary inactive days neither active nor frozen", () => {
    const day = isoDaysAgo(4);
    const cal = generateStreakCalendar({}, 30, []);
    const cell = cal.find((c) => c.date === day)!;
    expect(cell.active).toBe(false);
    expect(cell.frozen).toBe(false);
  });

  it("defaults to no frozen days when the argument is omitted", () => {
    const cal = generateStreakCalendar({});
    expect(cal.every((c) => c.frozen === false)).toBe(true);
  });
});

describe("generateWeekCalendar — freeze merge", () => {
  it("marks a frozen day within the current week as frozen", () => {
    // Pick a day guaranteed to sit inside the current Sun–Sat window: today.
    const today = isoDaysAgo(0);
    const cal = generateWeekCalendar({}, [today]);
    const cell = cal.find((c) => c.date === today)!;
    expect(cell.frozen).toBe(true);
    expect(cell.active).toBe(false);
  });

  it("returns seven days and never marks an active day frozen", () => {
    const today = isoDaysAgo(0);
    const cal = generateWeekCalendar({ [today]: 2 }, [today]);
    expect(cal).toHaveLength(7);
    const cell = cal.find((c) => c.date === today)!;
    expect(cell.active).toBe(true);
    expect(cell.frozen).toBe(false);
  });
});
