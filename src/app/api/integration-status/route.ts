import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireDiagnosticsAccess } from "@/lib/server/request-security";

type Readiness = {
  ready: boolean;
  missing: string[];
};

function readiness(keys: string[]): Readiness {
  const missing = keys.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });
  return {
    ready: missing.length === 0,
    missing,
  };
}

export async function GET(request: NextRequest) {
  const diagnosticsAccessError = requireDiagnosticsAccess(request);
  if (diagnosticsAccessError) return diagnosticsAccessError;

  const oauth = readiness([
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
  ]);
  const analytics = readiness([
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_CLARITY_PROJECT_ID",
  ]);
  const sentry = readiness(["NEXT_PUBLIC_SENTRY_DSN"]);
  const cms = readiness([
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    "NEXT_PUBLIC_SANITY_DATASET",
    "SANITY_API_READ_TOKEN",
  ]);

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      ready: oauth.ready && analytics.ready && sentry.ready && cms.ready,
      oauth,
      analytics,
      sentry,
      cms,
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
