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

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  const connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");

  const [courses, achievements, authorityCheck] = await Promise.all([
    getAllCoursesAdmin(),
    getAllAchievementsAdmin(),
    verifyAuthorityMatchesConfig(),
  ]);

  const courseStatuses = await Promise.all(
    courses.map(async (course) => {
      if (isDraftId(course._id)) {
        return {
          sanityId: course._id,
          slug: course.slug,
          title: course.title,
          isDraft: true,
          lessonCount: course.lessonCount,
          sanityXpPerLesson: course.xpPerLesson,
          missingFields: [],
          onChainStatus: "draft" as const,
          coursePda: null,
          differences: [],
        };
      }

      const missingFields = getMissingCourseFields(course);
      if (missingFields.length > 0) {
        return {
          sanityId: course._id,
          slug: course.slug,
          title: course.title,
          isDraft: false,
          lessonCount: course.lessonCount,
          sanityXpPerLesson: course.xpPerLesson,
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
          sanityId: course._id,
          slug: course.slug,
          title: course.title,
          isDraft: false,
          lessonCount: course.lessonCount,
          sanityXpPerLesson: course.xpPerLesson,
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
        sanityId: course._id,
        slug: course.slug,
        title: course.title,
        isDraft: false,
        lessonCount: course.lessonCount,
        sanityXpPerLesson: course.xpPerLesson,
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
          sanityId: ach._id,
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
          sanityId: ach._id,
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
          sanityId: ach._id,
          name: ach.name,
          missingFields: [],
          onChainStatus: "not_deployed" as const,
          achievementPda: null,
          collectionAddress: null,
        };
      }

      return {
        sanityId: ach._id,
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
