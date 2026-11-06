/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { getUser, signOut, rpc, list, remove, isRateLimited, updateUserById } =
  vi.hoisted(() => ({
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
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

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

  it("removes the file before the RPC, while the session can still retry", async () => {
    await POST();

    const removedAt = remove.mock.invocationCallOrder[0]!;
    const rpcAt = rpc.mock.invocationCallOrder[0]!;
    const signOutAt = signOut.mock.invocationCallOrder[0]!;
    expect(removedAt).toBeLessThan(rpcAt);
    expect(rpcAt).toBeLessThan(signOutAt);
  });

  it.each([
    [
      "listing",
      () => list.mockResolvedValue({ data: null, error: { message: "x" } }),
    ],
    ["removing", () => remove.mockResolvedValue({ error: { message: "x" } })],
  ])(
    "reports a failure %s the avatar and changes nothing else",
    async (_label, arrange) => {
      arrange();

      const res = await POST();

      expect(res.status).toBe(500);
      expect(rpc).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    }
  );

  it("reports a failed RPC and leaves the session so the client can retry", async () => {
    rpc.mockResolvedValue({ error: { message: "boom" } });

    const res = await POST();

    expect(res.status).toBe(500);
    expect(signOut).not.toHaveBeenCalled();
    expect(updateUserById).not.toHaveBeenCalled();
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
