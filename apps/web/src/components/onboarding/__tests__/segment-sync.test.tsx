// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import {
  hasSegmentState,
  setExperience,
  updateSegmentState,
} from "@/lib/onboarding/segment-state";
import { SegmentSync } from "../segment-sync";

const auth = vi.hoisted(() => ({ userId: "user-a" as string | null }));
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ userId: auth.userId }),
}));

// Chainable supabase stub: select→eq→single resolves READ; update→eq resolves WRITE.
const db = vi.hoisted(() => ({
  segment: null as number | null,
  readError: null as { message: string } | null,
  writeError: null as { message: string } | null,
  updatePayload: undefined as Record<string, unknown> | undefined,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: db.readError ? null : { segment: db.segment },
            error: db.readError,
          }),
        }),
      }),
      update: (payload: Record<string, unknown>) => {
        db.updatePayload = payload;
        return { eq: async () => ({ error: db.writeError }) };
      },
    }),
  }),
}));

beforeEach(() => {
  window.localStorage.clear();
  auth.userId = "user-a";
  db.segment = null;
  db.readError = null;
  db.writeError = null;
  db.updatePayload = undefined;
  setExperience("js_ts");
  updateSegmentState({ goal: "job", dailyGoal: 3 });
});

describe("SegmentSync — copy-on-signin (LX-A3) + shared-browser hygiene (F4)", () => {
  it("copies the local intake into an empty profile row and clears localStorage", async () => {
    render(<SegmentSync />);
    await waitFor(() => expect(db.updatePayload).toBeDefined());
    expect(db.updatePayload).toEqual({
      segment: 1,
      goal: "job",
      daily_goal: 3,
    });
    // F4: local copy cleared once the DB is authoritative.
    await waitFor(() => expect(hasSegmentState()).toBe(false));
  });

  it("never clobbers a returning user's stored segment, but still clears the stale local copy", async () => {
    db.segment = 2; // profile already authoritative for this user
    render(<SegmentSync />);
    // F4: the lingering anonymous copy is a bleed risk → dropped, no write.
    await waitFor(() => expect(hasSegmentState()).toBe(false));
    expect(db.updatePayload).toBeUndefined();
  });

  it("keeps the local copy on a transient read failure (retry can finish)", async () => {
    db.readError = { message: "network" };
    render(<SegmentSync />);
    await new Promise((r) => setTimeout(r, 0));
    expect(db.updatePayload).toBeUndefined();
    expect(hasSegmentState()).toBe(true);
  });

  it("keeps the local copy on a write failure (columns absent / transient)", async () => {
    db.writeError = { message: "column does not exist" };
    render(<SegmentSync />);
    await waitFor(() => expect(db.updatePayload).toBeDefined());
    expect(hasSegmentState()).toBe(true);
  });

  it("does nothing while signed out", async () => {
    auth.userId = null;
    render(<SegmentSync />);
    await new Promise((r) => setTimeout(r, 0));
    expect(db.updatePayload).toBeUndefined();
    expect(hasSegmentState()).toBe(true);
  });
});
