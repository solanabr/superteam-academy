export interface CompleteLessonRequest {
  courseId: string;
  lessonIndex: number;
  learnerWallet: string;
}

export interface CompleteLessonResponse {
  success: boolean;
  signature: string;
  xpEarned: number;
  isComplete: boolean;
  finalizeSignature?: string;
}

export interface FinalizeCourseRequest {
  courseId: string;
  learnerWallet: string;
}

export interface FinalizeCourseResponse {
  success: boolean;
  signature: string;
}

export interface IssueCredentialRequest {
  courseId: string;
  learnerWallet: string;
  credentialName: string;
  metadataUri: string;
  coursesCompleted: number;
  totalXp: number;
}

export interface IssueCredentialResponse {
  success: boolean;
  signature: string;
  credentialAsset: string;
}

export interface RewardXpRequest {
  recipientWallet: string;
  amount: number;
  memo: string;
}

export interface RewardXpResponse {
  success: boolean;
  signature: string;
}
