/* eslint-disable import/order -- vi.mock calls must precede importing the module under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { DueReviewItem } from "../due-items";
import type { ResolvedReviewItem } from "@/lib/content/queries";

vi.mock("server-only", () => ({}));

const { getDueReviewItems, resolveReviewItems } = vi.hoisted(() => ({
  getDueReviewItems: vi.fn<() => Promise<DueReviewItem[]>>(),
  resolveReviewItems: vi.fn<() => Promise<ResolvedReviewItem[]>>(),
}));

vi.mock("../due-items", async () => {
  const actual =
    await vi.importActual<typeof import("../due-items")>("../due-items");
  return { ...actual, getDueReviewItems };
});
vi.mock("@/lib/content/queries", () => ({ resolveReviewItems }));

import { buildReviewSession } from "../session";
import { REVIEW_SESSION_CAP } from "../due-items";

const client = {} as SupabaseClient<Database>;

function due(itemKey: string, box = 1): DueReviewItem {
  return { item_key: itemKey, box, due_at: "2026-07-26T00:00:00Z", lapses: 0 };
}
function resolved(
  itemKey: string,
  skills: string[] = ["react"]
): ResolvedReviewItem {
  return {
    itemKey,
    lessonTitle: `Lesson ${itemKey}`,
    lessonSlug: itemKey,
    courseId: "course-1",
    courseSlug: "course",
    skills,
    quiz: [],
  };
}

describe("buildReviewSession (LX-B5 composition)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the queue through the capped primitive with no widening limit", async () => {
    getDueReviewItems.mockResolvedValue([]);
    await buildReviewSession(client, "user-1");
    // Called with (client, userId) only — no options object that could raise
    // the read past REVIEW_SESSION_CAP.
    expect(getDueReviewItems).toHaveBeenCalledWith(client, "user-1");
  });

  it("renders at most the session cap even when the queue is full", async () => {
    const keys = Array.from({ length: REVIEW_SESSION_CAP }, (_, i) => `l${i}`);
    getDueReviewItems.mockResolvedValue(keys.map((k) => due(k)));
    resolveReviewItems.mockResolvedValue(keys.map((k) => resolved(k)));

    const session = await buildReviewSession(client, "user-1");

    expect(session).toHaveLength(REVIEW_SESSION_CAP);
    expect(REVIEW_SESSION_CAP).toBe(6);
    // Resolution is asked only for the capped key set.
    expect(resolveReviewItems).toHaveBeenCalledWith(keys);
  });

  it("carries each item's box through from the due row", async () => {
    getDueReviewItems.mockResolvedValue([due("a", 3), due("b", 1)]);
    resolveReviewItems.mockResolvedValue([resolved("a"), resolved("b")]);
    const session = await buildReviewSession(client, "user-1");
    expect(session.find((i) => i.itemKey === "a")?.box).toBe(3);
    expect(session.find((i) => i.itemKey === "b")?.box).toBe(1);
  });

  it("drops items whose lesson no longer resolves in the bundle", async () => {
    getDueReviewItems.mockResolvedValue([due("a"), due("gone")]);
    // resolveReviewItems already omits unresolvable keys.
    resolveReviewItems.mockResolvedValue([resolved("a")]);
    const session = await buildReviewSession(client, "user-1");
    expect(session.map((i) => i.itemKey)).toEqual(["a"]);
  });

  it("returns an empty session when nothing is due (no resolve call)", async () => {
    getDueReviewItems.mockResolvedValue([]);
    const session = await buildReviewSession(client, "user-1");
    expect(session).toEqual([]);
    expect(resolveReviewItems).not.toHaveBeenCalled();
  });

  it("interleaves confusable pairs inside the resolved set", async () => {
    getDueReviewItems.mockResolvedValue([due("pda"), due("mid"), due("am")]);
    resolveReviewItems.mockResolvedValue([
      resolved("pda", ["pdas"]),
      resolved("mid", ["react"]),
      resolved("am", ["account-model"]),
    ]);
    const session = await buildReviewSession(client, "user-1");
    expect(session.map((i) => i.itemKey)).toEqual(["pda", "am", "mid"]);
  });
});
