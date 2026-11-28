import "server-only";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";

/**
 * The service-role key is unset, so no admin (service-role) client can be
 * made. Only possible outside production: there the key is required at boot
 * (`lib/env.server.ts`). Callers refuse the request; none may read this as an
 * empty result or a pass.
 *
 * Lives apart from `lib/supabase/admin.ts` so that suites which mock that
 * module still get the real class and availability check.
 */
export class AdminClientUnavailableError extends Error {
  constructor() {
    super("The admin database client is not configured");
    this.name = "AdminClientUnavailableError";
  }
}

export function isAdminClientAvailable(): boolean {
  return Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}

/** The service-role key, or {@link AdminClientUnavailableError} when unset. */
export function requireServiceRoleKey(): string {
  const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new AdminClientUnavailableError();
  return key;
}

/** The one answer a route gives when it cannot make the admin client. */
export function adminClientUnavailableResponse(): NextResponse {
  return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
}
