/* eslint-disable import/order -- vi.mock calls must precede imports. */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { adminIn, adminNot, adminClient } = vi.hoisted(() => ({
  adminIn: vi.fn(),
  adminNot: vi.fn(),
  adminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => adminClient(),
}));

const fakeAdmin = () => ({
  from: () => ({
    select: () => ({
      in: (column: string, ids: string[]) => {
        adminIn(column, ids);
        return { not: adminNot };
      },
    }),
  }),
});

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { buildAuthor, fetchAuthorProfiles } from "../author-profiles";

const publicClient = (rows: unknown[]) =>
  ({
    from: () => ({
      select: () => ({ in: async () => ({ data: rows }) }),
    }),
  }) as unknown as SupabaseClient<Database>;

const PUBLIC_ROW = { id: "public", username: "ana", avatar_url: "a.png" };

beforeEach(() => {
  vi.resetAllMocks();
  adminClient.mockImplementation(fakeAdmin);
  adminNot.mockResolvedValue({ data: [{ id: "gone" }], error: null });
});

describe("community authors", () => {
  it("tells a deleted author from a private one", async () => {
    const profiles = await fetchAuthorProfiles(publicClient([PUBLIC_ROW]), [
      "public",
      "private",
      "gone",
    ]);

    expect(buildAuthor("public", profiles, {})).toMatchObject({
      username: "ana",
      deleted: false,
    });
    expect(buildAuthor("private", profiles, {})).toMatchObject({
      username: null,
      deleted: false,
    });
    expect(buildAuthor("gone", profiles, {})).toEqual({
      username: null,
      avatar_url: null,
      level: 0,
      deleted: true,
    });
  });

  it("only asks about authors missing from the public view", async () => {
    await fetchAuthorProfiles(publicClient([PUBLIC_ROW]), ["public", "gone"]);

    expect(adminIn).toHaveBeenCalledWith("id", ["gone"]);
    expect(adminNot).toHaveBeenCalledWith("deleted_at", "is", null);
  });

  it("skips the lookup when every author is public", async () => {
    await fetchAuthorProfiles(publicClient([PUBLIC_ROW]), ["public"]);

    expect(adminIn).not.toHaveBeenCalled();
  });

  it("falls back to the anonymous label when the lookup fails", async () => {
    adminNot.mockResolvedValue({ data: null, error: { message: "x" } });

    const profiles = await fetchAuthorProfiles(publicClient([]), ["gone"]);

    expect(buildAuthor("gone", profiles, {}).deleted).toBe(false);
  });

  it("falls back to the anonymous label when the admin client can't be built", async () => {
    adminClient.mockImplementation(() => {
      throw new Error("missing env");
    });

    const profiles = await fetchAuthorProfiles(publicClient([]), ["gone"]);

    expect(buildAuthor("gone", profiles, {}).deleted).toBe(false);
  });
});
