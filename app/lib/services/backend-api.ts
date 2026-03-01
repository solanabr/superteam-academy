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
  trackId?: number;
  trackLevel?: number;
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

async function postBff(path: string, params: object, token?: string | null): Promise<BackendApiResponse> {
  const url = resolveUrl(path);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
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
  params: CreateCourseParams,
  token?: string | null
): Promise<BackendApiResponse> {
  return postBff("/create-course", params, token);
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


export const updateConfig = (params: UpdateConfigParams, token?: string | null) =>
  postBff("/update-config", params, token);

export const updateCourse = (params: UpdateCourseParams, token?: string | null) =>
  postBff("/update-course", params, token);

export const issueCredential = (params: IssueCredentialParams) =>
  postBff("/issue-credential", params);

export const upgradeCredential = (params: UpgradeCredentialParams) =>
  postBff("/upgrade-credential", params);

export const registerMinter = (params: RegisterMinterParams, token?: string | null) =>
  postBff("/register-minter", params, token);

export const revokeMinter = (params: RevokeMinterParams, token?: string | null) =>
  postBff("/revoke-minter", params, token);

export const rewardXp = (params: RewardXpParams, token?: string | null) =>
  postBff("/reward-xp", params, token);

export const createAchievementType = (params: CreateAchievementTypeParams, token?: string | null) =>
  postBff("/create-achievement-type", params, token);

export const awardAchievement = (params: AwardAchievementParams, token?: string | null) =>
  postBff("/award-achievement", params, token);

export const deactivateAchievementType = (
  params: DeactivateAchievementTypeParams,
  token?: string | null
) => postBff("/deactivate-achievement-type", params, token);

export interface IndexEnrollmentParams {
  learner: string;
  courseId: string;
  txSignature: string;
}

export async function indexEnrollment(
  params: IndexEnrollmentParams
): Promise<void> {
  await postBff("/index-enrollment", params);
}

// Credential collections (authority only)
export interface CreateCredentialCollectionParams {
  name: string;
  description?: string;
  imageBase64?: string;
  imageFilename?: string;
}

export async function createCredentialCollection(
  params: CreateCredentialCollectionParams,
  token?: string | null
): Promise<BackendApiResponse & { collection?: string; trackId?: number }> {
  return postBff("/create-credential-collection", params, token) as Promise<
    BackendApiResponse & { collection?: string; trackId?: number }
  >;
}

export async function issueCredentialForCompletion(
  params: { courseId: string; learner: string; trackCollection?: string },
  token?: string | null
): Promise<BackendApiResponse> {
  return postBff("/issue-credential-for-completion", params, token);
}

// Upload credential metadata JSON to Pinata (via backend); returns URI or error.
export interface UploadCredentialMetadataParams {
  name: string;
  description?: string;
  attributes?: Record<string, string | number>;
  imageBase64?: string;
  imageFilename?: string;
}

export async function uploadCredentialMetadata(
  params: UploadCredentialMetadataParams,
  token?: string | null
): Promise<{ uri?: string; error?: string }> {
  const url = resolveUrl("/upload-credential-metadata");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });
    const body = (await res.json()) as { ok?: boolean; data?: { uri?: string }; error?: string };
    if (!res.ok) return { error: body.error ?? res.statusText ?? "Upload failed" };
    const data = body.ok && body.data ? body.data : (body as { uri?: string });
    return data.uri ? { uri: data.uri } : { error: "No URI returned" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    return { error: msg };
  }
}
