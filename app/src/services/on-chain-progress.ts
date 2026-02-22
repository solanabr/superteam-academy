import { SignJWT } from "jose";
import type {
  OnChainProgressService,
  LessonCompletionResult,
  CredentialIssuanceResult,
} from "./interfaces";

// ---------------------------------------------------------------------------
// Backend Signer Implementation
// Calls the Hono backend server which holds the backend_signer keypair.
// Auth: short-lived HS256 JWT signed with the shared AUTH_SECRET.
// ---------------------------------------------------------------------------

class BackendSignerOnChainProgressService implements OnChainProgressService {
  constructor(
    private readonly baseUrl: string,
    private readonly authSecret: string,
  ) {}

  private async makeJwt(userId: string): Promise<string> {
    const secret = new TextEncoder().encode(this.authSecret);
    return new SignJWT({ sub: userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(secret);
  }

  private async post<T extends Record<string, unknown>>(
    path: string,
    body: Record<string, unknown>,
    userId: string,
  ): Promise<{ ok: boolean; data: T }> {
    try {
      const token = await this.makeJwt(userId);
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as T;
      return { ok: res.ok, data };
    } catch {
      return { ok: false, data: {} as T };
    }
  }

  async completeLesson(params: {
    courseId: string;
    lessonIndex: number;
    learnerWallet: string;
    userId: string;
  }): Promise<LessonCompletionResult> {
    const { courseId, lessonIndex, learnerWallet, userId } = params;

    const { ok, data } = await this.post<{
      success: boolean;
      xpEarned?: number;
      signature?: string;
      isComplete?: boolean;
      finalizeSignature?: string;
    }>("/complete-lesson", { courseId, lessonIndex, learnerWallet }, userId);

    if (!ok) {
      const backendError =
        (data as Record<string, unknown>).error as string | undefined ??
        (data as Record<string, unknown>).message as string | undefined ??
        `Backend responded with an error`;
      return { confirmed: false, xpEarned: undefined, signature: undefined, finalized: false, backendError };
    }

    return {
      confirmed: true,
      xpEarned: data.xpEarned,
      signature: data.signature,
      finalized: data.isComplete === true && !!data.finalizeSignature,
    };
  }

  async finalizeCourse(params: {
    courseId: string;
    learnerWallet: string;
    userId: string;
  }): Promise<{ confirmed: boolean; signature: string | undefined }> {
    const { courseId, learnerWallet, userId } = params;
    const { ok, data } = await this.post<{ success: boolean; signature?: string }>(
      "/finalize-course",
      { courseId, learnerWallet },
      userId,
    );
    return { confirmed: ok && data.success === true, signature: data.signature };
  }

  async issueCredential(params: {
    courseId: string;
    learnerWallet: string;
    userId: string;
    credentialName: string;
    metadataUri: string;
    coursesCompleted: number;
    totalXp: number;
  }): Promise<CredentialIssuanceResult> {
    const { userId, ...body } = params;
    const { ok, data } = await this.post<{
      success: boolean;
      signature?: string;
      credentialAsset?: string;
    }>("/issue-credential", body, userId);
    return {
      confirmed: ok && data.success === true,
      signature: data.signature,
      credentialAsset: data.credentialAsset,
    };
  }
}

// ---------------------------------------------------------------------------
// No-Op Implementation
// Used when BACKEND_URL is not configured (local dev without the signer).
// All methods succeed silently so the UI stays functional.
// ---------------------------------------------------------------------------

class NoOpOnChainProgressService implements OnChainProgressService {
  async completeLesson(_params: Parameters<OnChainProgressService["completeLesson"]>[0]): Promise<LessonCompletionResult> {
    return { confirmed: false, xpEarned: undefined, signature: undefined, finalized: false };
  }

  async finalizeCourse(
    _params: Parameters<OnChainProgressService["finalizeCourse"]>[0],
  ): Promise<{ confirmed: boolean; signature: string | undefined }> {
    return { confirmed: false, signature: undefined };
  }

  async issueCredential(
    _params: Parameters<OnChainProgressService["issueCredential"]>[0],
  ): Promise<CredentialIssuanceResult> {
    return { confirmed: false, signature: undefined, credentialAsset: undefined };
  }
}

// ---------------------------------------------------------------------------
// Singleton with fallback
// ---------------------------------------------------------------------------

function createService(): OnChainProgressService {
  const backendUrl = process.env.BACKEND_URL;
  const authSecret = process.env.AUTH_SECRET;
  if (backendUrl && authSecret) {
    return new BackendSignerOnChainProgressService(backendUrl, authSecret);
  }
  return new NoOpOnChainProgressService();
}

export const onChainProgressService: OnChainProgressService = createService();
