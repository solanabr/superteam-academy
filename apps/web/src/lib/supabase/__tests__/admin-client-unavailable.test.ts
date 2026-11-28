import { describe, it, expect, vi } from "vitest";
import { createAdminClient } from "../admin";
import {
  AdminClientUnavailableError,
  adminClientUnavailableResponse,
  isAdminClientAvailable,
  requireServiceRoleKey,
} from "../admin-unavailable";

const h = vi.hoisted(() => ({
  serverEnv: {} as { SUPABASE_SERVICE_ROLE_KEY?: string },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({ serverEnv: h.serverEnv }));

describe("createAdminClient", () => {
  it("throws AdminClientUnavailableError when the service-role key is unset", () => {
    h.serverEnv.SUPABASE_SERVICE_ROLE_KEY = undefined;
    expect(isAdminClientAvailable()).toBe(false);
    expect(() => createAdminClient()).toThrow(AdminClientUnavailableError);
    expect(() => requireServiceRoleKey()).toThrow(AdminClientUnavailableError);
  });

  it("makes a client when the service-role key is set", () => {
    h.serverEnv.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    expect(isAdminClientAvailable()).toBe(true);
    expect(typeof createAdminClient().from).toBe("function");
    expect(requireServiceRoleKey()).toBe("service-role");
  });
});

describe("adminClientUnavailableResponse", () => {
  it("answers 503 with a fixed message that names no variable", async () => {
    const res = adminClientUnavailableResponse();
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ error: "Service unavailable" });
  });
});
