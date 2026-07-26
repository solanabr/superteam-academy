import { describe, it, expect } from "vitest";
import {
  EVALUATION_WINDOW_WEEKS,
  EVALUATION_WINDOW_DAYS,
  EXPERIMENT_REGISTRY,
  earliestReadDate,
  isReadable,
  registryWithEarliestRead,
  type ExperimentRegistryEntry,
} from "../experiment-registry";

describe("evaluation window constants", () => {
  it("floors the window at 10 weeks / 70 days (PED-15/PED-31/MAS-29)", () => {
    expect(EVALUATION_WINDOW_WEEKS).toBe(10);
    expect(EVALUATION_WINDOW_DAYS).toBe(70);
  });
});

describe("earliestReadDate — exposure start + 70 days, computed", () => {
  it("adds exactly 70 days to the exposure start", () => {
    expect(earliestReadDate("2026-08-01")).toBe("2026-10-10");
  });

  it("crosses a month boundary correctly", () => {
    // 2026-07-26 + 70d = 2026-10-04
    expect(earliestReadDate("2026-07-26")).toBe("2026-10-04");
  });

  it("crosses a year boundary correctly", () => {
    // 2026-11-30 + 70d = 2027-02-08
    expect(earliestReadDate("2026-11-30")).toBe("2027-02-08");
  });

  it("handles a leap-year February in the window", () => {
    // 2028 is a leap year: 2028-01-15 + 70d = 2028-03-25
    expect(earliestReadDate("2028-01-15")).toBe("2028-03-25");
  });

  it("returns null when the clock has not started", () => {
    expect(earliestReadDate(null)).toBeNull();
    expect(earliestReadDate(undefined)).toBeNull();
  });

  it("rejects a malformed date rather than reading a bogus window", () => {
    expect(() => earliestReadDate("2026/08/01")).toThrow();
  });
});

describe("isReadable — fails closed inside the novelty trough", () => {
  const entry: ExperimentRegistryEntry = {
    id: "t",
    mechanic: "test",
    hypothesis: "h",
    primaryMetric: "m",
    exposureUnit: "learner",
    exposureStart: "2026-08-01",
    evidenceBasis: "PED-15",
    preregisteredDirection: "up",
    status: "live",
  };

  it("is false the day before the earliest-read date", () => {
    expect(isReadable(entry, new Date("2026-10-09T23:59:59Z"))).toBe(false);
  });

  it("is true on and after the earliest-read date", () => {
    expect(isReadable(entry, new Date("2026-10-10T00:00:00Z"))).toBe(true);
    expect(isReadable(entry, new Date("2026-12-01T00:00:00Z"))).toBe(true);
  });

  it("is false when exposure has not started (no launch date)", () => {
    const { exposureStart: _drop, ...noStart } = entry;
    void _drop;
    // LAUNCH_DATE is null in the repo, so a launch-cohort row has no clock yet.
    expect(isReadable(noStart)).toBe(false);
  });
});

describe("EXPERIMENT_REGISTRY seed", () => {
  it("has a row for every launch-cycle mechanic with a unique id", () => {
    const ids = EXPERIMENT_REGISTRY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        "celebration-retiering",
        "prominence-demotion",
        "endowed-progress",
        "continue-card",
        "earn-handoff",
        "share-nudge",
        "quiz-feedback",
        "streak-freeze-insurance",
      ])
    );
  });

  it("every row carries the columns the rule needs", () => {
    for (const entry of EXPERIMENT_REGISTRY) {
      expect(entry.hypothesis).toBeTruthy();
      expect(entry.primaryMetric).toBeTruthy();
      expect(entry.exposureUnit).toBeTruthy();
      expect(entry.evidenceBasis).toBeTruthy();
      expect(entry.preregisteredDirection).toBeTruthy();
    }
  });

  it("no row is readable while LAUNCH_DATE is unset — the rule holds by default", () => {
    for (const row of registryWithEarliestRead()) {
      expect(row.earliestReadDate).toBeNull();
      expect(isReadable(row)).toBe(false);
    }
  });
});
