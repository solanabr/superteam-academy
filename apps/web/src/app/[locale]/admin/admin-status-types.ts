/**
 * Response shape of the `/api/admin/status` route (relocated from the deleted
 * stacked `admin-client.tsx` in SP3-A; extended with per-course drift fields
 * in SP3-C). Shared by the deploy and status screens, which each fetch what
 * they need from the same endpoint (plan ambiguity 2: no API split).
 */

import type { AwardT } from "@superteam-lms/content-schema";
import type { DiffEntry } from "@/lib/admin/sync-diff";
import type { ChainDriftState, CourseContentDrift } from "@/lib/github/drift";

// Re-exported so UI components share the diff engine's entry shape instead of
// carrying duplicate local copies (SP3-C Task 2 consolidation).
export type { DiffEntry };

export interface CourseStatus {
  contentId: string;
  slug: string;
  title: string;
  isDraft: boolean;
  lessonCount: number;
  contentXpPerLesson: number | null;
  missingFields: string[];
  onChainStatus:
    | "synced"
    | "out_of_sync"
    | "not_deployed"
    | "draft"
    | "missing_fields"
    // #434: the on-chain account exists but couldn't be decoded (post-Phase-1
    // layout mismatch) — distinct from "synced" so a broken read never shows
    // as green.
    | "undecodable"
    // #436: the Supabase deployment-row read failed — distinct from
    // "out_of_sync" so a DB blip isn't reported as a real content mismatch.
    | "db_unavailable";
  coursePda: string | null;
  differences: DiffEntry[];
  // Repo-wide content drift (SP3-C): the committed bundle's pinned SHA vs
  // courses-academy HEAD, or "unknown" when HEAD couldn't be fetched. Same value
  // for every course; the badge only surfaces it on a deployed row.
  contentDrift: CourseContentDrift;
  // Per-course chain drift (SP3-C Task 2): the deployed Course.content_tx_id
  // vs the BUNDLE sha (not HEAD) — "does deploying now change the on-chain
  // content commitment for THIS course". null for drafts or when the on-chain
  // account could not be decoded.
  chainDrift: ChainDriftState | null;
  // Authoritative on-chain is_active. Absent for not-yet-deployed/draft courses
  // (treated as active). false → deactivated (hidden from the public catalog).
  isActive?: boolean;
  // The resolved `course.creator` wallet (#433, #478) — the SAME value the
  // deploy path (`/api/admin/courses/sync`) uses as `Course.creator`. On a
  // first deploy this is the wallet the course will be PERMANENTLY attributed
  // to (`Course.creator` is set once at `create_course` and is immutable), so
  // the change-preview surfaces it before the operator confirms. Optional
  // (like `isActive`) so existing fixtures/tests unrelated to #433 don't need
  // updating; every branch of `/api/admin/status` sets it. null only when the
  // content bundle has no creator wallet set (blocks deploy earlier via
  // `missingFields`, so in practice this is non-null by the time a course
  // reaches `not_deployed`).
  creatorWallet?: string | null;
}

export interface AchievementStatus {
  contentId: string;
  name: string;
  missingFields: string[];
  // #436: "db_unavailable" — the account exists on-chain but the Supabase
  // deployment-row read failed, so it can't be confirmed as "synced".
  onChainStatus:
    | "synced"
    | "not_deployed"
    | "missing_fields"
    | "draft"
    | "db_unavailable";
  achievementPda: string | null;
  collectionAddress: string | null;
  /**
   * The achievement's declarative unlock rule (#513 WS-C), passed through
   * unmodified from {@link AdminAchievement.award} so the relocated Content
   * tab can optionally show `award.course`/`award.path`. `null` for a
   * pre-sync/legacy doc.
   */
  award: AwardT | null;
}

export interface AdminStatus {
  program: {
    deployed: boolean;
    programId: string;
    configPda: string | null;
    minterRegistered: boolean;
    authorityMatch: {
      matches: boolean;
      configAuthority?: string;
      localKey?: string;
    };
  };
  courses: CourseStatus[];
  achievements: AchievementStatus[];
}
