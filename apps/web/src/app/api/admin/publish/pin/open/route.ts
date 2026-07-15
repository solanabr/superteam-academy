import "server-only";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { sanitizeReason } from "@/lib/admin/sanitize-reason";
import {
  createGitHubClient,
  createGitHubWriteClient,
  type GitTreeEntry,
} from "@/lib/github/github";
import {
  GitHubUnavailableError,
  RefExistsError,
  TreeTruncatedError,
} from "@/lib/github/types";
import {
  CONTENT_REPO,
  buildPrTitle,
  buildOpenPrBody,
  suggestBranchName,
} from "@/lib/github/publish-pin";
import {
  bundleFreshFiles,
  retainedBaseEntries,
} from "@/lib/github/publish-tree";
import { compileBundle } from "@/lib/content/compile/compile-bundle";
import { extractTarball } from "@/lib/content/compile/tarball";
import { ContentValidationError } from "@/lib/content/compile/types";
import { contentMeta } from "@/lib/content/meta";
import { serverEnv } from "@/lib/env.server";

/**
 * POST /api/admin/publish/pin/open — one-click publish (WS-B).
 *
 * Recompiles the content bundle IN-ROUTE at the current courses-academy HEAD and
 * opens a `chore/content-pin-<sha>` PR against the app repo `main` (content.lock
 * bump + regenerated bundle in ONE commit). Recompiling in-route (not a GitHub
 * Action) matters: an Action committing with the default GITHUB_TOKEN would
 * SUPPRESS the CI "Content bundle freshness" byte-check; a route + dedicated PAT
 * creates a ref that fires `push: ["**"]`, so the byte-check runs pre-merge.
 *
 * The route can ONLY create `chore/content-pin-*` refs + PRs — it holds no
 * update-ref/force-push path, so it is structurally incapable of writing `main`
 * (branch protection on `main` is the real backstop). Every outbound error is
 * scrubbed via `sanitizeReason`; the write token is never echoed.
 *
 * Degrade ladder: token unset → 501 (client keeps the manual card); stale/red
 * HEAD or a pre-existing branch → 409 (never a 500 / force-push); GitHub write
 * failure → 502 (generic, scrubbed).
 */
export const dynamic = "force-dynamic";

const HEX_SHA = /^[0-9a-f]{40}$/i;

function fail(
  status: number,
  message: string,
  extra: Record<string, unknown> = {}
): NextResponse {
  return NextResponse.json(
    { error: sanitizeReason(message), ...extra },
    { status }
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  // Opt-in: no write token ⇒ the whole feature is unavailable. Surfaced as 501
  // so the client keeps rendering today's manual "Prepare publish PR" card.
  if (!serverEnv.GITHUB_PUBLISH_TOKEN) {
    return NextResponse.json({ unavailable: true }, { status: 501 });
  }

  let headSha: string;
  try {
    const body = (await req.json()) as { headSha?: unknown };
    if (typeof body.headSha !== "string" || !HEX_SHA.test(body.headSha)) {
      return fail(400, "headSha must be a 40-character hex commit sha");
    }
    headSha = body.headSha;
  } catch {
    return fail(400, "invalid JSON body");
  }

  try {
    const read = createGitHubClient();
    const write = createGitHubWriteClient();

    // ── Re-validate the client's headSha against live HEAD + CI (don't trust the
    // client: HEAD can advance or its checks redden between render and POST). ──
    const liveHead = await read.fetchHeadSha();
    if (headSha !== liveHead) {
      return fail(
        409,
        "courses-academy HEAD moved since this page loaded — refresh and retry",
        { code: "stale_head" }
      );
    }
    const checks = await read.fetchChecksState(headSha);
    if (checks !== "success") {
      return fail(
        409,
        "courses-academy HEAD checks are not green — refusing to publish unverified content",
        { code: "checks_not_green" }
      );
    }

    // ── Idempotency: a pre-existing branch for this sha degrades to 409, never a
    // 500 or a force-push. Checked up front; the createBranch 422 is the backstop. ──
    const branch = suggestBranchName(headSha);
    if (await write.branchExists(branch)) {
      return fail(
        409,
        `a publish PR branch for this content already exists (${branch})`,
        { code: "branch_exists" }
      );
    }

    // ── Recompile the bundle at HEAD (pure, in-memory). compiledAt is the
    // commit's own committer date so meta.json matches what CI recompiles. ──
    const [tarball, compiledAt] = await Promise.all([
      read.fetchTarball(headSha),
      read.fetchCommitDate(headSha),
    ]);
    const tree = await extractTarball(tarball);
    const bundle = compileBundle(tree, { sha: headSha, compiledAt });

    // ── Build the commit tree from scratch (mirrors writeBundle): carry every
    // non-managed base-tree leaf forward, replace the managed dirs + lock with
    // the fresh output. No base_tree overlay ⇒ no orphaned stale files. ──
    const base = await write.branchHead("main");
    const baseEntries = await write.recursiveTree(base.treeSha);
    const retained = retainedBaseEntries(baseEntries);

    const lockText = `${JSON.stringify({ repo: CONTENT_REPO, sha: headSha }, null, 2)}\n`;
    const freshFiles = bundleFreshFiles(bundle, lockText);
    const freshEntries: GitTreeEntry[] = await Promise.all(
      freshFiles.map(async (f) => ({
        path: f.path,
        mode: "100644",
        type: "blob" as const,
        sha: await write.createBlob(f.bytes),
      }))
    );

    const newTreeSha = await write.createTree([
      ...retained.map((e) => ({
        path: e.path,
        mode: e.mode,
        type: e.type as GitTreeEntry["type"],
        sha: e.sha,
      })),
      ...freshEntries,
    ]);

    // Content-addressed trees: an identical tree means main is already pinned to
    // this sha (a bump merged between render and POST) — refuse the empty PR.
    if (newTreeSha === base.treeSha) {
      return fail(
        409,
        "the content bundle is already pinned to this sha on main",
        { code: "already_pinned" }
      );
    }

    const commitSha = await write.createCommit({
      message: buildPrTitle(headSha),
      tree: newTreeSha,
      parents: [base.commitSha],
    });

    // createBranch throws RefExistsError (422) if the branch raced into
    // existence after the up-front check — same 409-degrade, no force-push.
    await write.createBranch(branch, commitSha);

    const pr = await write.openPullRequest({
      title: buildPrTitle(headSha),
      head: branch,
      base: "main",
      body: buildOpenPrBody({
        pinnedSha: contentMeta.sha,
        headSha,
        commitsBehind: null,
      }),
    });

    return NextResponse.json({
      pr: { url: pr.url, number: pr.number, branch },
      pinnedFrom: contentMeta.sha,
      pinnedTo: headSha,
    });
  } catch (e) {
    if (e instanceof RefExistsError) {
      return fail(409, e.message, { code: "branch_exists" });
    }
    if (e instanceof TreeTruncatedError) {
      return fail(502, e.message);
    }
    if (e instanceof ContentValidationError) {
      // A green HEAD should compile; if it didn't, don't leak the issue list.
      return fail(502, "content failed to compile at the requested sha");
    }
    if (e instanceof GitHubUnavailableError) {
      return fail(502, e.message);
    }
    // Never surface a raw 500 with a stack; scrub whatever we have.
    return fail(502, e instanceof Error ? e.message : "publish failed");
  }
}
