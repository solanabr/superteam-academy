import "server-only";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { createGitHubClient } from "@/lib/github/github";
import { GitHubUnavailableError, type ChecksState } from "@/lib/github/types";
import {
  computePublishVerdict,
  CONTENT_REPO,
  APP_REPO,
} from "@/lib/github/publish-pin";
import { contentMeta } from "@/lib/content/meta";

/**
 * GET /api/admin/publish/pin — the SP3-B "Content pin" data source.
 *
 * Returns the pinned SHA + counts (from the committed bundle's `meta.json`,
 * which the compiler writes from `content.lock`), courses-academy HEAD + its CI
 * checks, and a drift verdict. This route holds NO GitHub write token and never
 * writes the repo — the pin bump is a one-line human PR (spec rev-2, locked).
 * GitHub unreachable is a 503 so the card shows "drift unavailable" instead of
 * crashing, mirroring `/api/admin/content/drift`.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  const pinnedSha = contentMeta.sha;

  let headSha: string;
  let headChecks: ChecksState;
  let aheadBy: number | null = null;
  try {
    const github = createGitHubClient();
    headSha = await github.fetchHeadSha();
    headChecks = await github.fetchChecksState(headSha);
    // One extra compare call to surface "N commits behind"; best-effort so a
    // compare hiccup degrades to an unknown count rather than a 503.
    if (headSha !== pinnedSha) {
      try {
        aheadBy = await github.fetchAheadBy(pinnedSha, headSha);
      } catch {
        aheadBy = null;
      }
    } else {
      aheadBy = 0;
    }
  } catch (e) {
    if (e instanceof GitHubUnavailableError) {
      return NextResponse.json(
        { error: e.message, unavailable: true },
        { status: 503 }
      );
    }
    throw e;
  }

  const verdict = computePublishVerdict({
    pinnedSha,
    headSha,
    aheadBy,
    headChecks,
  });

  return NextResponse.json({
    pin: {
      sha: pinnedSha,
      counts: contentMeta.counts,
      compiledAt: contentMeta.compiledAt,
    },
    head: { sha: headSha, checks: headChecks },
    verdict,
    repos: { content: CONTENT_REPO, app: APP_REPO },
  });
}
