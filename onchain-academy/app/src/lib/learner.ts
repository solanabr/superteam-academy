import { resolveLearnerSession } from "./learner-session";

export function getLearnerId(walletAddress: string | null, authUser?: { id: string; email?: string | null; walletAddress?: string | null } | null) {
  return resolveLearnerSession({ walletAddress, authUser }).learnerId;
}

export function getEnrollmentKey(learnerId: string, courseId: string) {
  return `enrollment:${learnerId}:${courseId}`;
}

export function isLearnerEnrolled(learnerId: string, courseId: string) {
  void learnerId;
  void courseId;
  return false;
}
