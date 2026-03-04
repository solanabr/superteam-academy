import {
  onChainBridgeStrictMode,
  onChainWriteBridgeEnabled,
} from "@/lib/onchain/constants";
import type {
  ClaimAchievementBridgeRequest,
  CloseEnrollmentBridgeRequest,
  CompleteLessonBridgeRequest,
  EnrollBridgeRequest,
  FinalizeCourseBridgeRequest,
  IssueCredentialBridgeRequest,
  OnChainBridgeResponse,
  StartLessonBridgeRequest,
  UpgradeCredentialBridgeRequest,
} from "@/lib/onchain/bridge-types";

interface BridgeResult {
  ok: boolean;
  code: string;
  message: string;
}

async function postBridge<TPayload>(
  path: string,
  payload: TPayload
): Promise<BridgeResult> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as Partial<OnChainBridgeResponse>;
    return {
      ok: !!json.ok && res.ok,
      code: json.code || (res.ok ? "OK" : "BRIDGE_ERROR"),
      message: json.message || "Unexpected bridge response",
    };
  } catch (error) {
    return {
      ok: false,
      code: "BRIDGE_REQUEST_FAILED",
      message: error instanceof Error ? error.message : "Bridge request failed",
    };
  }
}

export function shouldUseOnChainBridge(): boolean {
  return onChainWriteBridgeEnabled();
}

export function isOnChainBridgeStrict(): boolean {
  return onChainBridgeStrictMode();
}

export async function enrollViaOnChainBridge(
  payload: EnrollBridgeRequest
): Promise<BridgeResult> {
  return postBridge("/api/learning/enroll", payload);
}

export async function completeLessonViaOnChainBridge(
  payload: CompleteLessonBridgeRequest
): Promise<BridgeResult> {
  return postBridge("/api/learning/complete-lesson", payload);
}

export async function completeCourseViaOnChainBridge(
  payload: FinalizeCourseBridgeRequest
): Promise<BridgeResult> {
  return postBridge("/api/learning/complete-course", payload);
}

export async function closeEnrollmentViaOnChainBridge(
  payload: CloseEnrollmentBridgeRequest
): Promise<BridgeResult> {
  return postBridge("/api/learning/close-enrollment", payload);
}

export async function startLessonViaOnChainBridge(
  payload: StartLessonBridgeRequest
): Promise<BridgeResult> {
  return postBridge("/api/learning/start-lesson", payload);
}

export async function claimAchievementViaOnChainBridge(
  payload: ClaimAchievementBridgeRequest
): Promise<BridgeResult> {
  return postBridge("/api/learning/claim-achievement", payload);
}

export async function issueCredentialViaOnChainBridge(
  payload: IssueCredentialBridgeRequest
): Promise<BridgeResult> {
  return postBridge("/api/learning/issue-credential", payload);
}

export async function upgradeCredentialViaOnChainBridge(
  payload: UpgradeCredentialBridgeRequest
): Promise<BridgeResult> {
  return postBridge("/api/learning/upgrade-credential", payload);
}
