import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkSchemaExpectations } from "@/lib/supabase/schema-expectations";

// Per-request DB probe against the caller's cookies (anon at deploy time) —
// never statically prerender. The anon client is deliberate: RPC probes must
// not carry EXECUTE on the service_role-only functions (see schema-expectations).
export const dynamic = "force-dynamic";

/**
 * Schema-expectation health check (#731). 200 when every release-critical DB
 * object exists; 503 (with the missing objects + the migration that creates
 * each) when the merge→apply gap is open. No secrets: uses the existing anon
 * server client.
 */
export async function GET() {
  const supabase = await createClient();
  const result = await checkSchemaExpectations(supabase);
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
