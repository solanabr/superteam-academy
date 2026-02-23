const headers = (secret: string) => ({
  "Content-Type": "application/json",
  "x-admin-secret": secret,
});

// ---------------------------------------------------------------------------
// Stats (read-only)
// ---------------------------------------------------------------------------

export interface AdminStats {
  config: {
    authority: string | null;
    backendSigner: string | null;
    xpMint: string | null;
    currentSeason: number;
    seasonClosed: boolean;
    totalCoursesCreated: number;
    maxDailyXp: number;
    maxAchievementXp: number;
  } | null;
  courses: {
    publicKey: string;
    courseId: string;
    creator: string | null;
    isActive: boolean;
    lessonCount: number;
    enrollments: number;
    completions: number;
    xpPerLesson: number;
    difficulty: number;
    trackId: number;
    trackLevel: number;
    creatorRewardXp: number;
    minCompletionsForReward: number;
  }[];
  learnerCount: number;
  learners: {
    wallet: string;
    displayName: string | null;
    xp: number;
    streak: number;
    joinedAt: string;
  }[];
  enrollments: {
    userId: string;
    courseId: string;
    lessonsCompleted: number;
    totalLessons: number;
    percentComplete: number;
    completedAt: string | null;
    enrolledAt: string;
  }[];
  minters: {
    publicKey: string;
    minter: string | null;
    label: string;
    maxXpPerCall: number;
  }[];
  achievementTypes: {
    publicKey: string;
    achievementId: string;
    name: string;
    collection: string | null;
    maxSupply: number;
    awarded: number;
    xpReward: number;
    isActive: boolean;
  }[];
}

export async function fetchStats(secret: string): Promise<AdminStats> {
  const res = await fetch("/api/admin/stats", {
    headers: headers(secret),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

export async function runSetup(secret: string) {
  const res = await fetch("/api/setup", {
    method: "POST",
    headers: headers(secret),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Seed Courses (save sample courses to DB)
// ---------------------------------------------------------------------------

export async function seedCourses(secret: string) {
  const res = await fetch("/api/admin/seed-courses", {
    method: "POST",
    headers: headers(secret),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export async function updateConfig(
  secret: string,
  data: {
    newBackendSigner?: string;
    maxDailyXp?: number;
    maxAchievementXp?: number;
  },
) {
  const res = await fetch("/api/admin/config", {
    method: "PUT",
    headers: headers(secret),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export async function createCourse(
  secret: string,
  data: {
    courseId: string;
    creator?: string;
    lessonCount: number;
    difficulty: number;
    xpPerLesson: number;
    trackId: number;
    trackLevel: number;
    prerequisite?: string;
    creatorRewardXp: number;
    minCompletionsForReward: number;
  },
) {
  const res = await fetch("/api/admin/course", {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCourse(
  secret: string,
  data: {
    courseId: string;
    newContentTxId?: string;
    newIsActive?: boolean;
    newXpPerLesson?: number;
    newCreatorRewardXp?: number;
    newMinCompletionsForReward?: number;
  },
) {
  const res = await fetch("/api/admin/course", {
    method: "PUT",
    headers: headers(secret),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

export async function createSeason(secret: string, season: number) {
  const res = await fetch("/api/admin/season", {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify({ season }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function closeSeason(secret: string) {
  const res = await fetch("/api/admin/season", {
    method: "DELETE",
    headers: headers(secret),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Minters
// ---------------------------------------------------------------------------

export async function registerMinter(
  secret: string,
  data: { minter: string; label: string; maxXpPerCall: number },
) {
  const res = await fetch("/api/admin/minter", {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function revokeMinter(secret: string, minter: string) {
  const res = await fetch("/api/admin/minter", {
    method: "DELETE",
    headers: headers(secret),
    body: JSON.stringify({ minter }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Achievement Types
// ---------------------------------------------------------------------------

export async function createAchievementType(
  secret: string,
  data: {
    achievementId: string;
    name: string;
    metadataUri?: string;
    maxSupply: number;
    xpReward: number;
  },
) {
  const res = await fetch("/api/admin/achievement-type", {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deactivateAchievementType(
  secret: string,
  achievementId: string,
) {
  const res = await fetch("/api/admin/achievement-type", {
    method: "DELETE",
    headers: headers(secret),
    body: JSON.stringify({ achievementId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Award Achievement
// ---------------------------------------------------------------------------

export async function awardAchievement(
  secret: string,
  data: { achievementId: string; recipient: string; collection: string },
) {
  const res = await fetch("/api/admin/award-achievement", {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Reward XP
// ---------------------------------------------------------------------------

export async function rewardXp(
  secret: string,
  data: { recipient: string; amount: number; memo?: string },
) {
  const res = await fetch("/api/admin/reward-xp", {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
