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
  type GitHubWriteClient,
  type GitTreeEntry,
} from "@/lib/github/github";
import {
  GitHubUnavailableError,
  RefExistsError,
  TreeTruncatedError,
} from "@/lib/github/types";
import {
  buildPrTitle,
  buildOpenPrBody,
  suggestBranchName,
} from "@/lib/github/publish-pin";
import {
  bumpLockContent,
  bundleFreshFiles,
  retainedBaseEntries,
  LOCK_REPO_PATH,
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

/**
 * Resolve a pre-existing `chore/content-pin-<sha>` branch (up-front check OR a
 * `createBranch` 422 race): if an OPEN PR already targets it, return that PR as
 * an idempotent success (a re-click gives the user the PR they wanted); if the
 * branch is orphaned (no open PR), degrade to an ACTIONABLE, scrubbed 409 that
 * names the branch — never a bare permanent 409 the user can't get past.
 */
async function existingBranchResponse(
  write: GitHubWriteClient,
  branch: string,
  headSha: string
): Promise<NextResponse> {
  const existing = await write.findOpenPrByHead(branch);
  if (existing) {
    return NextResponse.json({
      pr: { url: existing.url, number: existing.number, branch },
      pinnedFrom: contentMeta.sha,
      pinnedTo: headSha,
    });
  }
  return fail(
    409,
    `branch ${branch} exists without an open PR — delete it and retry`,
    { code: "branch_exists" }
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    // Any other auth-path error must NOT escape to a raw Next 500 with a stack;
    // scrub it and return a generic 500.
    return fail(500, e instanceof Error ? e.message : "authorization failed");
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

    // ── Idempotency: a pre-existing branch for this sha never force-pushes. If an
    // open PR already targets it, re-click returns that PR (200); an orphaned
    // branch degrades to an actionable 409. Checked up front; the createBranch
    // 422 race is the backstop (handled the same way at its call site). ──
    const branch = suggestBranchName(headSha);
    if (await write.branchExists(branch)) {
      return existingBranchResponse(write, branch, headSha);
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

    // ── Byte-preserving lock bump: read the CURRENT committed content.lock and
    // swap ONLY its sha (bumpLockContent) — never rebuild it from scratch, which
    // would strip any other field/ordering/whitespace. ──
    const lockEntry = baseEntries.find((e) => e.path === LOCK_REPO_PATH);
    if (!lockEntry) {
      return fail(502, "content.lock is missing from the base tree");
    }
    const currentLock = await write.readBlob(lockEntry.sha);
    const { text: lockText } = bumpLockContent(currentLock, headSha);
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
    // existence after the up-front check — resolve it the same way (existing PR
    // → 200, orphan → actionable 409); never a force-push.
    try {
      await write.createBranch(branch, commitSha);
    } catch (e) {
      if (e instanceof RefExistsError) {
        return existingBranchResponse(write, e.branch, headSha);
      }
      throw e;
    }

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
    // RefExistsError is handled at its only throw site (createBranch), so it
    // never reaches here.
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
