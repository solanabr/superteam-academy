import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { getAllCoursesAdmin } from "@/lib/content/queries";
import { fetchCourse } from "@/lib/solana/academy-reads";
import { getProgramId } from "@/lib/solana/pda";
import {
  getMissingCourseFields,
  isDraftId,
  type SyncStatus,
} from "@/lib/admin/sync-diff";
import { slotsByCourseId } from "@/lib/content/store";
import { SYNCED_SHA } from "@/lib/content/meta";
import { createGitHubClient } from "@/lib/github/github";
import { deriveActiveMask } from "@/lib/github/content-commit";
import { computeContentDrift, computeChainDrift } from "@/lib/github/drift";
import { GitHubUnavailableError } from "@/lib/github/types";

/**
 * The cheap chain-status a course needs for `computeChainDrift`. §11.1 replaces
 * the field-by-field `diffCourse` heuristic with the `content_tx_id == HEAD`
 * equality, so only "does the PDA exist / is Sanity complete" survives — both
 * derivable without decoding the whole on-chain account.
 */
function courseDiffStatus(
  course: Parameters<typeof getMissingCourseFields>[0],
  onChainExists: boolean
): SyncStatus {
  if (isDraftId(course._id)) return "draft";
  if (getMissingCourseFields(course).length > 0) return "missing_fields";
  if (!onChainExists) return "not_deployed";
  return "synced";
}

/**
 * Map every course id in the committed content bundle to its active_lessons
 * mask. SP2-B: sourced from `slotsByCourseId` (the pinned bundle's per-course
 * lockfiles) instead of a request-time GitHub tarball — no download on a drift
 * poll. A malformed lockfile is skipped, mirroring the prior best-effort.
 */
function maskByCourseFromBundle(): Map<
  string,
  [bigint, bigint, bigint, bigint]
> {
  const out = new Map<string, [bigint, bigint, bigint, bigint]>();
  for (const [id, slots] of slotsByCourseId) {
    try {
      out.set(id, deriveActiveMask(slots));
    } catch {
      // ignore a malformed lockfile — the mask is omitted for that course
    }
  }
  return out;
}

/**
 * GET /api/admin/content/drift — the §11 three-way drift view. Content drift
 * (repo → Sanity) is always computed; chain drift (Sanity → devnet) is computed
 * per course via the `content_tx_id == HEAD` equality plus the ordering
 * interlock (chain sync must wait for content sync). GitHub being unreachable is
 * a 503 so the panel shows "drift unavailable" rather than crashing.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  let headSha: string;
  let checks: Awaited<
    ReturnType<ReturnType<typeof createGitHubClient>["fetchChecksState"]>
  >;
  try {
    const github = createGitHubClient();
    headSha = await github.fetchHeadSha();
    checks = await github.fetchChecksState(headSha);
  } catch (e) {
    if (e instanceof GitHubUnavailableError) {
      return NextResponse.json(
        { error: e.message, unavailable: true },
        { status: 503 }
      );
    }
    throw e;
  }

  // The synced SHA is now the pinned content bundle's SHA (SP2-B): the committed
  // bundle IS the synced content, so drift is bundle-SHA vs GitHub HEAD.
  const syncedSha = SYNCED_SHA;
  const content = computeContentDrift({ syncedSha, headSha, checks });
  const contentUpToDate = content.state === "up_to_date";

  const courses = await getAllCoursesAdmin();

  // The intended active_lessons mask is only actionable once content is at HEAD
  // (the ordering interlock). Derive masks from the committed bundle in that
  // case — no runtime tarball fetch.
  let masks = new Map<string, [bigint, bigint, bigint, bigint]>();
  if (contentUpToDate && courses.length > 0) {
    masks = maskByCourseFromBundle();
  }

  const connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");
  const programId = getProgramId();

  const courseRows = await Promise.all(
    courses.map(async (course) => {
      let onChainContentTxId: number[] | null = null;
      let onChainExists = false;
      try {
        const onChain = await fetchCourse(course._id, connection, programId);
        if (onChain) {
          onChainExists = true;
          const raw = (onChain as { content_tx_id?: unknown }).content_tx_id;
          if (Array.isArray(raw)) onChainContentTxId = raw as number[];
          else if (raw instanceof Uint8Array)
            onChainContentTxId = Array.from(raw);
        }
      } catch {
        onChainExists = false;
      }
      const diffStatus = courseDiffStatus(course, onChainExists);
      const chainDrift = computeChainDrift({
        onChainContentTxId,
        headSha,
        diffStatus,
        contentUpToDate,
      });
      const mask = masks.get(course._id);
      return {
        id: course._id,
        title: course.title,
        chainDrift,
        activeLessons: mask ? mask.map((w) => w.toString()) : null,
      };
    })
  );

  return NextResponse.json({
    content: { ...content, syncedSha, headSha, checks },
    courses: courseRows,
  });
}
