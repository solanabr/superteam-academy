import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import {
  requirePreviewAuth,
  previewUnauthorizedResponse,
  TeachPreviewAuthError,
} from "@/lib/teach/preview-auth";
import { parsePrUrl, type PrUrlError } from "@/lib/teach/pr-url";
import {
  compilePrPreview,
  ContentValidationError,
  GitHubUnavailableError,
} from "@/lib/teach/preview-compile";

// Downloads + compiles a repo tarball: needs the Node runtime (gunzip/Buffer)
// and more than the default edge budget.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const URL_ERROR_MESSAGE: Record<PrUrlError, string> = {
  empty: "Paste a pull-request link.",
  malformed: "That does not look like a GitHub pull-request link.",
  wrong_host: "Only github.com links are supported.",
  wrong_repo:
    "Only pull requests in solanabr/academy-courses can be previewed.",
  not_a_pull_request:
    "That link points to something other than a pull request.",
};

/**
 * Compiles an academy-courses PR and returns its courses/lessons for preview
 * (#828). Read-only: nothing is written to the bundle and nothing touches
 * on-chain state.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requirePreviewAuth(req);
  } catch (e) {
    if (e instanceof TeachPreviewAuthError)
      return previewUnauthorizedResponse();
    throw e;
  }

  // Each preview downloads and compiles a repo tarball, so it is far heavier
  // than a normal read — throttle it per client.
  const ip = getClientIp(req.headers);
  if (
    await isRateLimited("teach-preview-compile", ip, {
      maxTokens: 12,
      refillIntervalMs: 60_000,
    })
  ) {
    return NextResponse.json(
      { error: "Too many previews. Try again shortly." },
      { status: 429 }
    );
  }

  let body: { prUrl?: unknown };
  try {
    body = (await req.json()) as { prUrl?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = parsePrUrl(typeof body.prUrl === "string" ? body.prUrl : "");
  if (!parsed.ok) {
    return NextResponse.json(
      { error: URL_ERROR_MESSAGE[parsed.error] },
      { status: 400 }
    );
  }

  try {
    const result = await compilePrPreview(parsed.number);
    return NextResponse.json(result);
  } catch (e) {
    // Schema/executor failures are the teacher's actual signal — surface the
    // issues verbatim rather than collapsing them into a generic 500. These are
    // the same messages CI would print for this PR.
    if (e instanceof ContentValidationError) {
      return NextResponse.json(
        { error: "validation_failed", issues: e.issues },
        { status: 422 }
      );
    }
    if (e instanceof GitHubUnavailableError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Could not compile this pull request." },
      { status: 500 }
    );
  }
}
