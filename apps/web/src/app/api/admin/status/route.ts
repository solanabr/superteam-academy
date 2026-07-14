import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import {
  getAllCoursesAdmin,
  getAllAchievementsAdmin,
} from "@/lib/content/queries";
import {
  findCoursePDA,
  findAchievementTypePDA,
  getProgramId,
} from "@/lib/solana/pda";
import { decodeCourse, type DecodedCourse } from "@/lib/solana/academy-reads";
import {
  verifyAuthorityMatchesConfig,
  isAdminSignerReady,
} from "@/lib/solana/admin-signer";
import {
  isDraftId,
  getMissingCourseFields,
  getMissingAchievementFields,
  diffCourse,
  type DiffEntry,
  type OnChainCourse,
} from "@/lib/admin/sync-diff";
import { SYNCED_SHA } from "@/lib/content/meta";
import { createGitHubClient } from "@/lib/github/github";
import {
  computeContentDrift,
  computeChainDrift,
  type ChainDriftState,
  type CourseContentDrift,
} from "@/lib/github/drift";

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

/**
 * Repo-wide content drift (SP3-C): the committed bundle's pinned SHA
 * (`content.lock` → `SYNCED_SHA`) vs courses-academy HEAD, folded into every
 * course record so a deployed-but-content-drifted course reads distinctly from
 * an in-sync one.
 *
 * Where a GitHub outage would 503 a dedicated drift route, the status route
 * also serves program liveness + on-chain course state, all independent of
 * GitHub — so a HEAD-fetch failure degrades this one field to an explicit
 * `"unknown"` and the route still returns 200. Any error here (unconfigured
 * token, rate limit, network) collapses to `"unknown"`; the drift screen owns
 * the loud "drift unavailable" surface.
 */
async function computeRepoContentDrift(): Promise<CourseContentDrift> {
  try {
    const github = createGitHubClient();
    const headSha = await github.fetchHeadSha();
    const checks = await github.fetchChecksState(headSha);
    return computeContentDrift({ syncedSha: SYNCED_SHA, headSha, checks })
      .state;
  } catch (e) {
    console.warn("[admin/status] content drift unavailable:", e);
    return "unknown";
  }
}

/**
 * Map the normalised `DecodedCourse` (snake_case — `decodeCourse` bypasses
 * Anchor's camelCase IDL conversion) to the diff engine's `OnChainCourse`.
 * Takes `DecodedCourse` directly (no shadow interface, no cast) so that a
 * field dropped from `DecodedCourse` fails `tsc`, not silently reads as
 * `undefined`.
 */
function toOnChainCourse(courseId: string, raw: DecodedCourse): OnChainCourse {
  return {
    courseId,
    creator: raw.creator.toBase58(),
    lessonCount: raw.liveLessonCount,
    difficulty: raw.difficulty,
    xpPerLesson: raw.xp_per_lesson,
    trackId: raw.track_id,
    trackLevel: raw.track_level,
    prerequisite: raw.prerequisite ? raw.prerequisite.toBase58() : null,
    creatorRewardXp: raw.creator_reward_xp,
    totalCompletions: raw.total_completions,
    totalEnrollments: raw.total_enrollments,
    isActive: raw.is_active,
    version: raw.version,
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  const connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");

  const [courses, achievements, authorityCheck, contentDrift] =
    await Promise.all([
      getAllCoursesAdmin(),
      getAllAchievementsAdmin(),
      verifyAuthorityMatchesConfig(),
      computeRepoContentDrift(),
    ]);

  const courseStatuses = await Promise.all(
    courses.map(async (course) => {
      if (isDraftId(course._id)) {
        return {
          contentId: course._id,
          slug: course.slug,
          title: course.title,
          isDraft: true,
          lessonCount: course.lessonCount,
          contentXpPerLesson: course.xpPerLesson,
          contentDrift,
          chainDrift: null,
          missingFields: [],
          onChainStatus: "draft" as const,
          coursePda: null,
          differences: [],
        };
      }

      const missingFields = getMissingCourseFields(course);
      if (missingFields.length > 0) {
        return {
          contentId: course._id,
          slug: course.slug,
          title: course.title,
          isDraft: false,
          lessonCount: course.lessonCount,
          contentXpPerLesson: course.xpPerLesson,
          contentDrift,
          chainDrift: "missing_fields" as const,
          missingFields,
          onChainStatus: "missing_fields" as const,
          coursePda: null,
          differences: [],
        };
      }

      const [coursePda] = findCoursePDA(course._id, getProgramId());
      const accountInfo = await connection.getAccountInfo(coursePda);

      if (!accountInfo) {
        return {
          contentId: course._id,
          slug: course.slug,
          title: course.title,
          isDraft: false,
          lessonCount: course.lessonCount,
          contentXpPerLesson: course.xpPerLesson,
          contentDrift,
          chainDrift: "not_deployed" as const,
          missingFields: [],
          onChainStatus: "not_deployed" as const,
          coursePda: null,
          differences: [],
        };
      }

      const pdaAddress = coursePda.toBase58();
      const knownPda = course.onChainStatus?.coursePda;
      const recordedStatus = course.onChainStatus?.status ?? "synced";

      // Authoritative on-chain state, decoded from the accountInfo already
      // fetched above — no extra RPC. is_active because the bundle mirror can
      // lag a failed deactivate write-back; the full account (SP3-C Task 2) so
      // the change-preview shows real field-level diffs (`diffCourse`) and the
      // per-course chain drift (content_tx_id vs the bundle SHA). Undecodable
      // account → defaults (active, no diffs, drift unknown → null).
      let isActive = true;
      let differences: DiffEntry[] = [];
      let chainDrift: ChainDriftState | null = null;
      try {
        const raw = decodeCourse(accountInfo.data);
        isActive = raw.is_active;
        // Resolve the bundle prerequisite to its Course PDA so the diff is
        // pubkey-to-pubkey (sync derivation, no RPC).
        const prerequisitePda = course.prerequisiteCourse
          ? findCoursePDA(
              course.prerequisiteCourse._id,
              getProgramId()
            )[0].toBase58()
          : null;
        const diff = diffCourse(
          course,
          toOnChainCourse(course._id, raw),
          prerequisitePda
        );
        differences = diff.differences;
        // Per-course chain drift vs the BUNDLE sha (SP2-B: the committed bundle
        // IS the synced content, so contentUpToDate is definitionally true and
        // headSha here is the bundle pin, not GitHub HEAD): content_stale means
        // deploying now would update this course's on-chain content commitment.
        chainDrift = computeChainDrift({
          onChainContentTxId: raw.content_tx_id,
          headSha: SYNCED_SHA,
          diffStatus: diff.status,
          contentUpToDate: true,
        });
      } catch (e) {
        // Stale/undecodable account — defaults above; log for diagnosis.
        console.warn(`[admin/status] could not decode ${course._id}:`, e);
      }

      const status =
        knownPda !== pdaAddress || differences.length > 0
          ? "out_of_sync"
          : recordedStatus;

      return {
        contentId: course._id,
        slug: course.slug,
        title: course.title,
        isDraft: false,
        lessonCount: course.lessonCount,
        contentXpPerLesson: course.xpPerLesson,
        contentDrift,
        chainDrift,
        missingFields: [],
        onChainStatus: status,
        coursePda: pdaAddress,
        differences,
        isActive,
      };
    })
  );

  const achievementStatuses = await Promise.all(
    achievements.map(async (ach) => {
      if (isDraftId(ach._id)) {
        return {
          contentId: ach._id,
          name: ach.name,
          missingFields: [],
          onChainStatus: "draft" as const,
          achievementPda: null,
          collectionAddress: null,
        };
      }

      const missingFields = getMissingAchievementFields(ach);
      if (missingFields.length > 0) {
        return {
          contentId: ach._id,
          name: ach.name,
          missingFields,
          onChainStatus: "missing_fields" as const,
          achievementPda: null,
          collectionAddress: null,
        };
      }

      const [achPda] = findAchievementTypePDA(ach._id, getProgramId());
      const accountInfo = await connection.getAccountInfo(achPda);

      if (!accountInfo) {
        return {
          contentId: ach._id,
          name: ach.name,
          missingFields: [],
          onChainStatus: "not_deployed" as const,
          achievementPda: null,
          collectionAddress: null,
        };
      }

      return {
        contentId: ach._id,
        name: ach.name,
        missingFields: [],
        onChainStatus: "synced" as const,
        achievementPda: achPda.toBase58(),
        collectionAddress: ach.onChainStatus?.collectionAddress ?? null,
      };
    })
  );

  return NextResponse.json({
    program: {
      deployed: authorityCheck.matches,
      programId: getProgramId().toBase58(),
      configPda: authorityCheck.configAuthority ? "found" : null,
      minterRegistered: isAdminSignerReady(),
      authorityMatch: authorityCheck,
    },
    courses: courseStatuses,
    achievements: achievementStatuses,
  });
}
