import "server-only";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { env } from "@/lib/env";
import { runContentSync } from "@/lib/content-sync/sync";
import { createGitHubClient } from "@/lib/github/github";
import { createLiveGateway } from "@/lib/content-sync/gateway";
import { createLiveGraders } from "@/lib/content-sync/graders";
import { BlockedCommitError, GitHubUnavailableError } from "@/lib/github/types";
import {
  ContentValidationError,
  BlastRadiusError,
} from "@/lib/content/compile/types";

/**
 * POST /api/admin/content/sync — sync courses-academy@sha → Sanity (§9.2).
 *
 * Thin handler: auth, parse+guard the body, build the real deps, delegate to
 * `runContentSync`, map its error classes to status codes. The client sends the
 * exact `sha` it saw in the drift panel (HEAD is never taken from the client);
 * the orchestrator re-checks that commit's CI and refuses a red one.
 *
 * Note: `runContentSync` never touches the on-chain mask, so `MaskMismatchError`
 * (a chain-sync error) cannot arise here — that branch lives only in
 * /api/admin/courses/sync (Task 13).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  let sha: string;
  try {
    const body = (await req.json()) as { sha?: unknown };
    if (typeof body.sha !== "string" || !/^[0-9a-f]{40}$/i.test(body.sha)) {
      return NextResponse.json(
        { error: "a 40-hex commit sha is required" },
        { status: 400 }
      );
    }
    sha = body.sha;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await runContentSync({
      sha,
      github: createGitHubClient(),
      gateway: createLiveGateway(),
      graders: createLiveGraders(),
      projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof BlockedCommitError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    if (e instanceof BlastRadiusError) {
      return NextResponse.json(
        { error: e.message, override: "explicit admin override required" },
        { status: 409 }
      );
    }
    if (e instanceof ContentValidationError) {
      return NextResponse.json(
        { error: e.message, issues: e.issues },
        { status: 422 }
      );
    }
    if (e instanceof GitHubUnavailableError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    console.error("[admin/content/sync]", e);
    return NextResponse.json({ error: "Content sync failed" }, { status: 500 });
  }
}
