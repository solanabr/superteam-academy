import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  requireDiagnosticsAccess,
  requireSameOrigin,
} from "@/lib/server/request-security";

type SentryTestRequest = {
  target?: "server" | "client";
};

export async function POST(request: NextRequest) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const diagnosticsAccessError = requireDiagnosticsAccess(request);
  if (diagnosticsAccessError) return diagnosticsAccessError;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return NextResponse.json(
      { ok: false, error: "Sentry DSN is not configured." },
      { status: 400 },
    );
  }

  let body: SentryTestRequest = {};
  try {
    body = (await request.json()) as SentryTestRequest;
  } catch {
    body = {};
  }

  const target = body.target ?? "server";
  const environment =
    process.env.NEXT_PUBLIC_APP_ENV ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development";
  const release =
    process.env.NEXT_PUBLIC_APP_RELEASE ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    "local-dev";
  const error = new Error(
    `[sentry-smoke-test] ${target} ${new Date().toISOString()}`,
  );

  const eventId = Sentry.captureException(error, {
    tags: {
      smoke_test: "true",
      target,
      environment,
      release,
    },
    level: "error",
    extra: {
      query_hint: "tag:smoke_test tag:target",
    },
  });

  await Sentry.flush(2000);

  return NextResponse.json({
    ok: true,
    eventId,
    target,
    environment,
    release,
    searchHint: `smoke_test:true target:${target}`,
  });
}
