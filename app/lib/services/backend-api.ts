function resolveUrl(path: string): string {
  // Client calls BFF (/api/academy) which proxies to backend with API token.
  // Empty base = same-origin; set NEXT_PUBLIC_APP_URL only for custom app URL.
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/api/academy${path}` : `/api/academy${path}`;
}

export interface CreateCourseParams {
  courseId?: string;
  lessonCount?: number;
  xpPerLesson?: number;
  creator?: string;
}

export interface CompleteLessonParams {
  courseId?: string;
  learner: string;
  lessonIndex?: number;
}

export interface FinalizeCourseParams {
  courseId?: string;
  learner: string;
}

export interface UpdateConfigParams {
  newBackendSigner: string;
}

export interface UpdateCourseParams {
  courseId?: string;
  newContentTxId?: number[] | null;
  newIsActive?: boolean | null;
  newXpPerLesson?: number | null;
  newCreatorRewardXp?: number | null;
  newMinCompletionsForReward?: number | null;
}

export interface IssueCredentialParams {
  courseId?: string;
  learner: string;
  credentialName: string;
  metadataUri: string;
  coursesCompleted?: number;
  totalXp?: number;
  trackCollection: string;
}

export interface UpgradeCredentialParams {
  courseId?: string;
  learner: string;
  credentialAsset: string;
  credentialName: string;
  metadataUri: string;
  coursesCompleted?: number;
  totalXp?: number;
  trackCollection: string;
}

export interface RegisterMinterParams {
  minter: string;
  label?: string;
  maxXpPerCall?: number;
}

export interface RevokeMinterParams {
  minter: string;
}

export interface RewardXpParams {
  recipient: string;
  amount: number;
  memo?: string;
}

export interface CreateAchievementTypeParams {
  achievementId: string;
  name: string;
  metadataUri: string;
  maxSupply?: number;
  xpReward?: number;
}

export interface AwardAchievementParams {
  achievementId: string;
  recipient: string;
  collection: string;
}

export interface DeactivateAchievementTypeParams {
  achievementId: string;
}

export interface BackendApiResponse {
  tx?: string;
  error?: string;
  credentialAsset?: string;
  collection?: string;
  asset?: string;
}

async function postBff(path: string, params: object): Promise<BackendApiResponse> {
  const url = resolveUrl(path);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { error: msg.includes("fetch") ? "Request failed. Check backend and API token." : msg };
  }
  let body: { ok?: boolean; data?: BackendApiResponse; error?: string };
  try {
    body = (await res.json()) as { ok?: boolean; data?: BackendApiResponse; error?: string };
  } catch {
    return { error: res.ok ? "Invalid response from server" : res.statusText || "Request failed" };
  }
  if (!res.ok) {
    const err = "error" in body ? body.error : undefined;
    return { error: err ?? res.statusText ?? "Request failed" };
  }
  return body.ok && body.data ? body.data : (body as unknown as BackendApiResponse);
}

export async function createCourse(
  params: CreateCourseParams
): Promise<BackendApiResponse> {
  return postBff("/create-course", params);
}

export async function completeLesson(
  params: CompleteLessonParams
): Promise<BackendApiResponse> {
  return postBff("/complete-lesson", params);
}

export async function finalizeCourse(
  params: FinalizeCourseParams
): Promise<BackendApiResponse> {
  return postBff("/finalize-course", params);
}


export const updateConfig = (params: UpdateConfigParams) =>
  postBff("/update-config", params);

export const updateCourse = (params: UpdateCourseParams) =>
  postBff("/update-course", params);

export const issueCredential = (params: IssueCredentialParams) =>
  postBff("/issue-credential", params);

export const upgradeCredential = (params: UpgradeCredentialParams) =>
  postBff("/upgrade-credential", params);

export const registerMinter = (params: RegisterMinterParams) =>
  postBff("/register-minter", params);

export const revokeMinter = (params: RevokeMinterParams) =>
  postBff("/revoke-minter", params);

export const rewardXp = (params: RewardXpParams) =>
  postBff("/reward-xp", params);

export const createAchievementType = (params: CreateAchievementTypeParams) =>
  postBff("/create-achievement-type", params);

export const awardAchievement = (params: AwardAchievementParams) =>
  postBff("/award-achievement", params);

export const deactivateAchievementType = (
  params: DeactivateAchievementTypeParams
) => postBff("/deactivate-achievement-type", params);
