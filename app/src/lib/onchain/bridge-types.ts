export type OnChainAction =
  | "enroll"
  | "close_enrollment"
  | "complete_lesson"
  | "complete_course"
  | "finalize_course"
  | "claim_achievement"
  | "start_lesson"
  | "issue_credential"
  | "upgrade_credential";

export interface EnrollBridgeRequest {
  courseId: string;
  trackId?: string;
}

export interface CloseEnrollmentBridgeRequest {
  courseId: string;
}

export interface CompleteLessonBridgeRequest {
  courseId: string;
  lessonIndex: number;
  xpAmount?: number;
}

export interface FinalizeCourseBridgeRequest {
  courseId: string;
}

export interface ClaimAchievementBridgeRequest {
  achievementId: string | number;
}

export interface StartLessonBridgeRequest {
  courseId: string;
  lessonIndex: number;
}

export interface IssueCredentialBridgeRequest {
  courseId: string;
  metadataUri: string;
  credentialName?: string;
  coursesCompleted?: number;
  totalXp?: number;
  trackCollection?: string;
}

export interface UpgradeCredentialBridgeRequest {
  courseId: string;
  metadataUri: string;
  credentialName?: string;
  coursesCompleted?: number;
  totalXp?: number;
  trackCollection?: string;
}

export interface OnChainBridgeResponse {
  ok: boolean;
  action: OnChainAction;
  code: string;
  message: string;
  signature?: string;
  accountHints?: Record<string, string>;
}
