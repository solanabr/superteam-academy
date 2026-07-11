/**
 * Response shape of the UNCHANGED `/api/admin/status` route, relocated
 * verbatim from the deleted stacked `admin-client.tsx` (SP3-A Task 3).
 * Shared by the deploy and status screens, which each fetch what they need
 * from the same endpoint (plan ambiguity 2: no API split in SP3-A).
 */

import type { CourseContentDrift } from "@/lib/github/drift";

export interface DiffEntry {
  field: string;
  sanityValue: unknown;
  onChainValue: unknown;
  updateable: boolean;
}

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
    | "missing_fields";
  coursePda: string | null;
  differences: DiffEntry[];
  // Repo-wide content drift (SP3-C): the committed bundle's pinned SHA vs
  // courses-academy HEAD, or "unknown" when HEAD couldn't be fetched. Same value
  // for every course; the badge only surfaces it on a deployed row.
  contentDrift: CourseContentDrift;
  // Authoritative on-chain is_active. Absent for not-yet-deployed/draft courses
  // (treated as active). false → deactivated (hidden from the public catalog).
  isActive?: boolean;
}

export interface AchievementStatus {
  contentId: string;
  name: string;
  missingFields: string[];
  onChainStatus: "synced" | "not_deployed" | "missing_fields" | "draft";
  achievementPda: string | null;
  collectionAddress: string | null;
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
