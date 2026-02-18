import "server-only";

import { cache } from "react";
import type { AuthenticatedUser } from "@/lib/server/auth-adapter";
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";
import { getActivityData } from "@/lib/server/activity-store";

export const getProfileIdentity = cache((user: AuthenticatedUser) =>
  getIdentitySnapshotForUser(user),
);

export const getProfileCourses = cache((wallet: string) =>
  getAllCourseProgressSnapshots(wallet),
);

export const getProfileActivity = cache((wallet: string) =>
  getActivityData(wallet, 365),
);
