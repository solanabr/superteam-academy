import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { json_error, json_ok } from "@/lib/api/response";
import { admin_certificates_query_schema } from "@/lib/validators/admin";

export async function GET(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const url = new URL(request.url);
  const parsed = admin_certificates_query_schema.safeParse({
    limit: url.searchParams.get("limit"),
    offset: url.searchParams.get("offset"),
  });
  if (!parsed.success) return json_error("Invalid query", 400);

  return json_ok({ certificates: [], total: 0 });
}
