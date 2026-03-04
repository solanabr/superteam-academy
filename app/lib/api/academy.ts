import { env } from "@/lib/env";

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function getBaseUrl(): string {
  return normalizeApiBaseUrl(env.NEXT_PUBLIC_ACADEMY_API_URL);
}

export class AcademyApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = status;
  }
}

async function handleResponse<T>(
  response: Response,
  parse: (data: unknown) => T,
): Promise<T> {
  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    const parsed = (payload as { ok?: boolean; error?: string })?.error;
    throw new AcademyApiError(
      typeof parsed === "string" ? parsed : "API_ERROR",
      response.status,
    );
  }
  return parse(payload);
}

export async function getConfig(): Promise<{
  xpMint: string;
  backendSigner?: string;
  authority?: string;
}> {
  const res = await fetch(`${getBaseUrl()}/config`);
  return handleResponse(
    res,
    (d) => d as { xpMint: string; backendSigner?: string; authority?: string },
  );
}

export async function getCourses(activeOnly = true): Promise<
  Array<{
    courseId: string;
    lessonCount: number;
    xpPerLesson: number;
    isActive: boolean;
    creator: string;
  }>
> {
  const url = `${getBaseUrl()}/courses${activeOnly ? "" : "?active=false"}`;
  const res = await fetch(url);
  return handleResponse(
    res,
    (d) =>
      d as Array<{
        courseId: string;
        lessonCount: number;
        xpPerLesson: number;
        isActive: boolean;
        creator: string;
      }>,
  );
}

export async function getCourse(courseId: string): Promise<{
  courseId: string;
  lessonCount: number;
  xpPerLesson: number;
  isActive: boolean;
  creator: string;
} | null> {
  const res = await fetch(
    `${getBaseUrl()}/courses/${encodeURIComponent(courseId)}`,
  );
  if (res.status === 404) return null;
  return handleResponse(
    res,
    (d) =>
      d as {
        courseId: string;
        lessonCount: number;
        xpPerLesson: number;
        isActive: boolean;
        creator: string;
      },
  );
}

export async function getEnrollment(
  courseId: string,
  learner: string,
): Promise<{
  lessonFlags: bigint[];
  completedAt: bigint | null;
  credentialAsset: string | null;
} | null> {
  const url = `${getBaseUrl()}/courses/${encodeURIComponent(courseId)}/enrollment?learner=${encodeURIComponent(learner)}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  return handleResponse(
    res,
    (d) =>
      d as {
        lessonFlags: bigint[];
        completedAt: bigint | null;
        credentialAsset: string | null;
      },
  );
}

export async function getXpBalance(
  learner: string,
): Promise<{ balance: number; ata: string }> {
  const res = await fetch(
    `${getBaseUrl()}/xp-balance?learner=${encodeURIComponent(learner)}`,
  );
  return handleResponse(res, (d) => d as { balance: number; ata: string });
}

export async function getLeaderboard(): Promise<
  Array<{ rank: number; wallet: string; xp: number }>
> {
  const res = await fetch(`${getBaseUrl()}/leaderboard`, {
    next: { revalidate: 60 },
  });
  return handleResponse(
    res,
    (d) => d as Array<{ rank: number; wallet: string; xp: number }>,
  );
}

export type Profile = {
  wallet: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  socialLinks: string | null;
  joinDate: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
};

export async function getProfileMe(learner: string): Promise<Profile | null> {
  const res = await fetch(
    `${getBaseUrl()}/profile/me?learner=${encodeURIComponent(learner)}`,
  );
  if (res.status === 404) return null;
  return handleResponse(res, (d) => d as Profile);
}

export async function getProfileByWallet(
  wallet: string,
): Promise<Profile | null> {
  const res = await fetch(
    `${getBaseUrl()}/profile/by-wallet/${encodeURIComponent(wallet)}`,
  );
  if (res.status === 404) return null;
  return handleResponse(res, (d) => d as Profile);
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const res = await fetch(
    `${getBaseUrl()}/profile/by-username/${encodeURIComponent(username)}`,
  );
  if (res.status === 404) return null;
  return handleResponse(res, (d) => d as Profile);
}

export type UpdateProfileInput = {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: { twitter?: string; github?: string; website?: string };
  visibility?: "public" | "private";
  nonce: string;
  output: unknown;
};

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ ok: boolean; profile?: Profile; error?: string }> {
  const res = await fetch(`${getBaseUrl()}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    profile?: Profile;
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: data.error ?? "API_ERROR" };
  }
  return { ok: true, profile: data.profile };
}

export type CompletedEnrollment = {
  id: number;
  wallet: string;
  courseId: string;
  completedAt: string;
  credentialAsset: string | null;
  trackId: number;
  trackLevel: number;
};

export async function getCompletedCourses(
  walletOrUsername: string,
): Promise<CompletedEnrollment[]> {
  const res = await fetch(
    `${getBaseUrl()}/profile/${encodeURIComponent(walletOrUsername)}/completed-courses`,
  );
  if (res.status === 404) return [];
  return handleResponse(res, (d) => d as CompletedEnrollment[]);
}

export type Credential = {
  asset: string;
  trackId: number;
  trackLevel: number;
  verificationLink: string;
};

export async function getCredentials(wallet: string): Promise<Credential[]> {
  const res = await fetch(
    `${getBaseUrl()}/profile/${encodeURIComponent(wallet)}/credentials`,
  );
  return handleResponse(res, (d) => d as Credential[]);
}

export type Achievement = {
  achievementId: string;
  name: string;
  asset: string;
  awardedAt: number;
};

export async function getAchievements(wallet: string): Promise<Achievement[]> {
  const res = await fetch(
    `${getBaseUrl()}/profile/${encodeURIComponent(wallet)}/achievements`,
  );
  return handleResponse(res, (d) => d as Achievement[]);
}
