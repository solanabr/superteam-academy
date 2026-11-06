/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const {
  getUser,
  signOut,
  rpc,
  list,
  remove,
  isRateLimited,
  updateUserById,
  revalidateTag,
  logError,
} = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  logError: vi.fn(),
  getUser: vi.fn<() => Promise<unknown>>(),
  signOut: vi.fn(),
  updateUserById: vi.fn<() => Promise<{ error: unknown }>>(),
  rpc: vi.fn<(fn: string, args: unknown) => Promise<{ error: unknown }>>(),
  list: vi.fn<(path: string) => Promise<unknown>>(),
  remove: vi.fn<(paths: string[]) => Promise<{ error: unknown }>>(),
  isRateLimited: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser, signOut } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc,
    storage: { from: () => ({ list, remove }) },
    auth: { admin: { updateUserById } },
  }),
}));

vi.mock("@/lib/rate-limit", () => ({ isRateLimited }));
vi.mock("@/lib/logging", () => ({ logError }));
vi.mock("next/cache", () => ({ revalidateTag, unstable_cache: vi.fn() }));
vi.mock("@/lib/supabase/cookieless", () => ({
  createCookielessClient: vi.fn(),
}));

import { POST } from "../route";

beforeEach(() => {
  vi.resetAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  rpc.mockResolvedValue({ error: null });
  list.mockResolvedValue({ data: [{ name: "avatar.jpg" }], error: null });
  remove.mockResolvedValue({ error: null });
  isRateLimited.mockResolvedValue(false);
  signOut.mockResolvedValue({ error: null });
  updateUserById.mockResolvedValue({ error: null });
});

describe("account deletion", () => {
  it("runs the deletion policy RPC with the session's own id", async () => {
    const res = await POST();

    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("delete_account_data", {
      p_user_id: "user-1",
    });
  });

  it("removes the avatar file, scoped to the caller's own folder", async () => {
    await POST();

    expect(list).toHaveBeenCalledWith("user-1");
    expect(remove).toHaveBeenCalledWith(["user-1/avatar.jpg"]);
  });

  it("skips the storage delete when there is no file", async () => {
    list.mockResolvedValue({ data: [], error: null });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(remove).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalled();
  });

  it("removes the file only after the RPC commits, so a failed RPC loses nothing", async () => {
    await POST();

    const rpcAt = rpc.mock.invocationCallOrder[0]!;
    const listedAt = list.mock.invocationCallOrder[0]!;
    const removedAt = remove.mock.invocationCallOrder[0]!;
    const signOutAt = signOut.mock.invocationCallOrder[0]!;
    expect(rpcAt).toBeLessThan(listedAt);
    expect(listedAt).toBeLessThan(removedAt);
    expect(removedAt).toBeLessThan(signOutAt);
  });

  it("reports a failed RPC, keeps the avatar and leaves the session for a retry", async () => {
    rpc.mockResolvedValue({ error: { message: "boom" } });

    const res = await POST();

    expect(res.status).toBe(500);
    expect(list).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("a retry after a failed RPC runs the whole thing", async () => {
    rpc.mockResolvedValueOnce({ error: { message: "boom" } });

    expect((await POST()).status).toBe(500);
    expect((await POST()).status).toBe(200);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  // The account is already deleted when these run, and a retry would get 401, so
  // the file is left for the retention cron to finish.
  it.each([
    [
      "listing",
      () => list.mockResolvedValue({ data: null, error: { message: "x" } }),
    ],
    ["removing", () => remove.mockResolvedValue({ error: { message: "x" } })],
    ["a throw while listing", () => list.mockRejectedValue(new Error("x"))],
  ])(
    "%s the avatar failing still succeeds and logs",
    async (_label, arrange) => {
      arrange();

      const res = await POST();

      expect(res.status).toBe(200);
      expect(rpc).toHaveBeenCalled();
      expect(signOut).toHaveBeenCalled();
      expect(logError).toHaveBeenCalled();
    }
  );

  it("drops the deleted account from the cached leaderboard", async () => {
    await POST();

    expect(revalidateTag).toHaveBeenCalledWith("leaderboard");
    expect(rpc.mock.invocationCallOrder[0]!).toBeLessThan(
      revalidateTag.mock.invocationCallOrder[0]!
    );
  });

  it("a cache failure can't fail a deletion that already committed", async () => {
    revalidateTag.mockImplementation(() => {
      throw new Error("no store");
    });

    expect((await POST()).status).toBe(200);
  });

  it("clears the cookies and bans again after the RPC", async () => {
    await POST();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(updateUserById).toHaveBeenCalledWith("user-1", {
      ban_duration: "876600h",
    });
  });

  // The RPC already revoked sessions and set the ban in its own transaction. A
  // 500 here would send the client to retry an account it can no longer reach.
  it("still succeeds when signOut and the second ban both fail", async () => {
    signOut.mockResolvedValue({ error: { message: "gotrue down" } });
    updateUserById.mockResolvedValue({ error: { message: "still down" } });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledTimes(3);
  });

  it("does nothing when unauthenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST();

    expect(res.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("does nothing when rate limited", async () => {
    isRateLimited.mockResolvedValue(true);

    const res = await POST();

    expect(res.status).toBe(429);
    expect(rpc).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
  });

  it("keeps the rate limit key on the session's own id", async () => {
    await POST();

    expect(isRateLimited).toHaveBeenCalledWith(
      "account-delete",
      "user-1",
      expect.any(Object)
    );
  });
});
