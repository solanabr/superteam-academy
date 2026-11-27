/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route imports so the `server-only` graph loads under vitest. */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// The real requireAdminAuth. Only the session lookups are faked, so each case
// runs the handler itself: a GET's auth call can't stand in for a POST's.
const h = vi.hoisted(() => ({ isAdmin: true }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: h.isAdmin ? { id: "admin-1" } : null },
        error: null,
      }),
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: h.isAdmin ? { user_id: "admin-1" } : null,
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

type Handler = (req: NextRequest) => Promise<Response>;

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
const ROOT = join(__dirname, "..");

// Every mutating export of every admin route, whatever form it's declared in.
async function mutatingHandlers(): Promise<[string, string, Handler][]> {
  const files = readdirSync(ROOT, { recursive: true, encoding: "utf8" }).filter(
    (file) => file.endsWith("route.ts")
  );
  const handlers: [string, string, Handler][] = [];
  for (const file of files) {
    const route = (await import(/* @vite-ignore */ join(ROOT, file))) as Record<
      string,
      unknown
    >;
    for (const method of MUTATING_METHODS) {
      if (typeof route[method] === "function") {
        handlers.push([file, method, route[method] as Handler]);
      }
    }
  }
  return handlers;
}

const call = (handler: Handler, method: string, contentType: string) =>
  handler(
    new Request("https://app.test/api/admin/x", {
      method,
      headers: {
        "sec-fetch-site": "same-origin",
        "content-type": contentType,
      },
      body: "{}",
    }) as unknown as NextRequest
  );

beforeEach(() => {
  h.isAdmin = true;
});

describe("admin mutating routes", () => {
  it("each tell an admin about a non-JSON body and tell anyone else nothing", async () => {
    const handlers = await mutatingHandlers();
    // Guards the walk above: an empty list would pass everything below.
    expect(handlers.length).toBeGreaterThanOrEqual(9);

    for (const [file, method, handler] of handlers) {
      for (const contentType of [
        "text/plain;charset=UTF-8",
        "application/x-www-form-urlencoded",
      ]) {
        h.isAdmin = true;
        const asAdmin = await call(handler, method, contentType);
        expect(asAdmin.status, `${method} ${file} admin`).toBe(415);

        h.isAdmin = false;
        const asOther = await call(handler, method, contentType);
        expect(asOther.status, `${method} ${file} non-admin`).toBe(401);
        expect(await asOther.json(), `${method} ${file} body`).toEqual({
          error: "Unauthorized",
        });
      }
    }
  }, 60_000);
});
