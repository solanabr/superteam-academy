/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
// The linked X handle is shown publicly as an account the author proved they
// own, so the route must take it from the session's X identity, never from the
// request, and write it with the service role.
import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUser, unlinkIdentity, profileUpdate } = vi.hoisted(() => ({
  getUser: vi.fn(),
  unlinkIdentity: vi.fn(),
  profileUpdate: vi.fn(),
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "svc" },
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser, unlinkIdentity } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (values: Record<string, unknown>) => ({
        eq: (_column: string, id: string) => profileUpdate(values, id),
      }),
    }),
  }),
}));

import { DELETE, POST } from "../route";

const X_IDENTITY = {
  provider: "x",
  identity_data: {
    sub: "1450000000000000000",
    user_name: "ana_dev",
    preferred_username: "ana_dev",
  },
};

function sessionWith(identities: unknown[]) {
  return {
    data: { user: { id: "user-1", identities } },
    error: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  unlinkIdentity.mockResolvedValue({ error: null });
  profileUpdate.mockResolvedValue({ error: null });
});

describe("POST /api/auth/x-account", () => {
  it("copies the session's X identity onto the caller's profile", async () => {
    getUser.mockResolvedValue(
      sessionWith([{ provider: "google", identity_data: {} }, X_IDENTITY])
    );

    const res = await POST();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ xUsername: "ana_dev" });
    expect(profileUpdate).toHaveBeenCalledWith(
      { x_id: "1450000000000000000", x_username: "ana_dev" },
      "user-1"
    );
  });

  it("401s without a session", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST();
    expect(res.status).toBe(401);
    expect(profileUpdate).not.toHaveBeenCalled();
  });

  it("refuses when no X identity is linked", async () => {
    getUser.mockResolvedValue(
      sessionWith([{ provider: "google", identity_data: {} }])
    );
    const res = await POST();
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "xNotLinked" });
    expect(profileUpdate).not.toHaveBeenCalled();
  });

  it("refuses a handle X would not issue, so it can never reach a URL", async () => {
    getUser.mockResolvedValue(
      sessionWith([
        {
          provider: "x",
          identity_data: { sub: "1", user_name: "evil/../path" },
        },
      ])
    );
    const res = await POST();
    expect(res.status).toBe(422);
    expect(profileUpdate).not.toHaveBeenCalled();
  });

  it("reports an X account already on another profile", async () => {
    getUser.mockResolvedValue(sessionWith([X_IDENTITY]));
    profileUpdate.mockResolvedValue({
      error: { code: "23505", message: "duplicate key" },
    });
    const res = await POST();
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "xAlreadyLinked" });
  });
});

describe("DELETE /api/auth/x-account", () => {
  it("drops the X identity and clears the profile columns", async () => {
    getUser.mockResolvedValue(sessionWith([X_IDENTITY]));

    const res = await DELETE();

    expect(res.status).toBe(200);
    expect(unlinkIdentity).toHaveBeenCalledWith(X_IDENTITY);
    expect(profileUpdate).toHaveBeenCalledWith(
      { x_id: null, x_username: null },
      "user-1"
    );
  });

  it("still clears the columns when the identity is already gone", async () => {
    getUser.mockResolvedValue(sessionWith([]));
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(unlinkIdentity).not.toHaveBeenCalled();
    expect(profileUpdate).toHaveBeenCalledWith(
      { x_id: null, x_username: null },
      "user-1"
    );
  });

  it("leaves the profile alone when the identity unlink fails", async () => {
    getUser.mockResolvedValue(sessionWith([X_IDENTITY]));
    unlinkIdentity.mockResolvedValue({ error: { message: "nope" } });
    const res = await DELETE();
    expect(res.status).toBe(500);
    expect(profileUpdate).not.toHaveBeenCalled();
  });
});
