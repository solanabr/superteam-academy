import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEventByAchievementId } from "../queries";

const h = vi.hoisted(() => ({
  available: true,
  row: null as Record<string, unknown> | null,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", async () => {
  const { AdminClientUnavailableError } =
    await import("@/lib/supabase/admin-unavailable");
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: h.row, error: null }),
  };
  return {
    createAdminClient: () => {
      if (!h.available) throw new AdminClientUnavailableError();
      return { from: () => chain };
    },
  };
});

beforeEach(() => {
  h.available = true;
  h.row = null;
});

describe("getEventByAchievementId", () => {
  it("maps the event row", async () => {
    h.row = {
      id: "e1",
      achievement_id: "event-demo-day",
      name: "Demo Day",
      description: "d",
      image_url: null,
      xp_reward: 50,
      starts_at: "2026-11-01T00:00:00Z",
      ends_at: "2026-11-02T00:00:00Z",
    };
    await expect(getEventByAchievementId("event-demo-day")).resolves.toEqual(
      expect.objectContaining({ id: "e1", name: "Demo Day", xpReward: 50 })
    );
  });

  it("is null, like a missing event, when the admin client is unavailable", async () => {
    h.available = false;
    await expect(getEventByAchievementId("event-demo-day")).resolves.toBeNull();
  });
});
