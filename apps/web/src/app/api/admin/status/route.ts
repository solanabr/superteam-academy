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
import { decodeCourse } from "@/lib/solana/academy-reads";
import {
  verifyAuthorityMatchesConfig,
  isAdminSignerReady,
} from "@/lib/solana/admin-signer";
import {
  isDraftId,
  getMissingCourseFields,
  getMissingAchievementFields,
} from "@/lib/admin/sync-diff";
import { SYNCED_SHA } from "@/lib/content/meta";
import { createGitHubClient } from "@/lib/github/github";
import {
  computeContentDrift,
  type CourseContentDrift,
} from "@/lib/github/drift";

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

/**
 * Repo-wide content drift (SP3-C): the committed bundle's pinned SHA
 * (`content.lock` → `SYNCED_SHA`) vs courses-academy HEAD, folded into every
 * course record so a deployed-but-content-drifted course reads distinctly from
 * an in-sync one. Reuses the same GitHub client as `/api/admin/content/drift`.
 *
 * Unlike that route (which 503s when GitHub is unreachable), the status route
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
  } catch {
    return "unknown";
  }
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
          missingFields: [],
          onChainStatus: "not_deployed" as const,
          coursePda: null,
          differences: [],
        };
      }

      const pdaAddress = coursePda.toBase58();
      const knownPda = course.onChainStatus?.coursePda;
      const sanityStatus = course.onChainStatus?.status ?? "synced";
      const status = knownPda === pdaAddress ? sanityStatus : "out_of_sync";

      // Authoritative on-chain is_active (the Sanity mirror can lag if a
      // deactivate write-back failed), so the admin table reflects the real
      // deactivated state and offers Reactivate. Decoded from the accountInfo
      // already fetched above — no extra RPC. Default true if undecodable.
      let isActive = true;
      try {
        const decoded = decodeCourse(accountInfo.data) as {
          is_active?: boolean;
        };
        if (typeof decoded.is_active === "boolean") {
          isActive = decoded.is_active;
        }
      } catch {
        // Stale/undecodable account — leave isActive at its default.
      }

      return {
        contentId: course._id,
        slug: course.slug,
        title: course.title,
        isDraft: false,
        lessonCount: course.lessonCount,
        contentXpPerLesson: course.xpPerLesson,
        contentDrift,
        missingFields: [],
        onChainStatus: status,
        coursePda: pdaAddress,
        differences: [],
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
