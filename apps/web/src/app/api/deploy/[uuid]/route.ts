import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCachedBinary } from "@/lib/build-server/binary-cache";

const BUILD_SERVER_URL = process.env.BUILD_SERVER_URL;
const BUILD_SERVER_API_KEY = process.env.BUILD_SERVER_API_KEY;
const UPSTREAM_TIMEOUT_MS = 30_000;

function serveBinary(binary: ArrayBuffer): NextResponse {
  return new NextResponse(binary, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(binary.byteLength),
      "Cache-Control": "private, max-age=300",
    },
  });
}

/**
 * Proxy the compiled .so binary download from the build server.
 *
 * Checks the in-memory cache first (populated by /api/build-program after
 * successful builds) to avoid Cloud Run instance routing misses.
 * Falls back to proxying directly to the build server if not cached.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
): Promise<NextResponse> {
  const { uuid } = await params;

  // Auth — require authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Validate UUID format (basic check — no path traversal)
  if (!/^[0-9a-f-]{36}$/i.test(uuid)) {
    return NextResponse.json({ error: "Invalid UUID" }, { status: 400 });
  }

  // Check in-memory cache first (pre-fetched after successful build)
  const cached = getCachedBinary(uuid);
  if (cached) {
    return serveBinary(cached);
  }

  // Fall back to proxying from build server
  if (!BUILD_SERVER_URL || !BUILD_SERVER_API_KEY) {
    return NextResponse.json(
      { error: "Build server is not configured" },
      { status: 503 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${BUILD_SERVER_URL}/deploy/${uuid}`, {
      headers: { "X-API-Key": BUILD_SERVER_API_KEY },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      const status = upstream.status === 404 ? 404 : 502;
      return NextResponse.json(
        {
          error:
            status === 404
              ? "Binary not found or build expired"
              : "Build server error",
        },
        { status }
      );
    }

    const binary = await upstream.arrayBuffer();
    return serveBinary(binary);
  } catch (err) {
    clearTimeout(timeout);
    const isAbort = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: isAbort ? "Download timed out" : "Failed to reach build server",
      },
      { status: 504 }
    );
  }
}
