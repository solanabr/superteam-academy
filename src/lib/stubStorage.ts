/**
 * Centralized localStorage key helpers for stub (demo) mode.
 *
 * Key scheme:
 *   Lesson complete:  academy:stub:devnet:<wallet>:<courseId>:lesson:<index>
 *   Course finalized: academy:stub:devnet:<wallet>:<courseId>:finalized
 *   Credential:       academy:stub:devnet:<wallet>:<courseId>:credential
 *   Local XP total:   academy:stub:devnet:<wallet>:xp
 *
 * Legacy lesson key (Slice 2): academy:stub:<courseId>:<index>:<wallet>
 * Both formats are checked for lesson completion.
 */

const NS = "academy:stub:devnet";

// ── Key builders ──────────────────────────────────────────────────────────────

export function lessonKey(wallet: string, courseId: string, index: number) {
  return `${NS}:${wallet}:${courseId}:lesson:${index}`;
}

/** Legacy key written by Slice 2 PlaygroundClient — kept for backwards compat */
export function legacyLessonKey(
  courseId: string,
  index: number,
  wallet: string,
) {
  return `academy:stub:${courseId}:${index}:${wallet}`;
}

export function finalizedKey(wallet: string, courseId: string) {
  return `${NS}:${wallet}:${courseId}:finalized`;
}

export function enrollmentKey(wallet: string, courseId: string) {
  return `${NS}:${wallet}:${courseId}:enrolled`;
}

export function credentialKey(wallet: string, courseId: string) {
  return `${NS}:${wallet}:${courseId}:credential`;
}

export function xpKey(wallet: string) {
  return `${NS}:${wallet}:xp`;
}

// ── Readers ───────────────────────────────────────────────────────────────────

function safe(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function isLessonCompleteStub(
  wallet: string,
  courseId: string,
  index: number,
): boolean {
  const ls = safe();
  if (!ls) return false;
  return (
    ls.getItem(lessonKey(wallet, courseId, index)) === "1" ||
    ls.getItem(legacyLessonKey(courseId, index, wallet)) === "1"
  );
}

export function countCompletedLessonsStub(
  wallet: string,
  courseId: string,
  lessonCount: number,
): number {
  let n = 0;
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonCompleteStub(wallet, courseId, i)) n++;
  }
  return n;
}

export function allLessonsCompleteStub(
  wallet: string,
  courseId: string,
  lessonCount: number,
): boolean {
  return (
    countCompletedLessonsStub(wallet, courseId, lessonCount) >= lessonCount
  );
}

export function isCourseFinalizedStub(
  wallet: string,
  courseId: string,
): boolean {
  const ls = safe();
  if (!ls) return false;
  return ls.getItem(finalizedKey(wallet, courseId)) === "1";
}

export function isCourseEnrolledStub(
  wallet: string,
  courseId: string,
): boolean {
  const ls = safe();
  if (!ls) return false;
  return ls.getItem(enrollmentKey(wallet, courseId)) === "1";
}

export function getAllStubEnrolledCourseIds(wallet: string): string[] {
  const ls = safe();
  if (!ls) return [];

  const suffix = ":enrolled";
  const prefix = `${NS}:${wallet}:`;
  const enrolled: string[] = [];

  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i);
    if (!key || !key.startsWith(prefix) || !key.endsWith(suffix)) continue;
    const courseId = key.slice(prefix.length, key.length - suffix.length);
    if (courseId) enrolled.push(courseId);
  }

  return enrolled;
}

export function getStubCredential(
  wallet: string,
  courseId: string,
): string | null {
  const ls = safe();
  if (!ls) return null;
  return ls.getItem(credentialKey(wallet, courseId));
}

export function getStubXp(wallet: string): number {
  const ls = safe();
  if (!ls) return 0;
  return parseInt(ls.getItem(xpKey(wallet)) ?? "0", 10) || 0;
}

// ── Writers ───────────────────────────────────────────────────────────────────

export function markLessonCompleteStub(
  wallet: string,
  courseId: string,
  index: number,
): void {
  const ls = safe();
  if (!ls) return;
  ls.setItem(lessonKey(wallet, courseId, index), "1");
  // Also write legacy key so Slice 2 reads still work
  ls.setItem(legacyLessonKey(courseId, index, wallet), "1");
}

export function markCourseFinalizedStub(
  wallet: string,
  courseId: string,
): void {
  const ls = safe();
  if (!ls) return;
  ls.setItem(finalizedKey(wallet, courseId), "1");
}

export function markCourseEnrolledStub(
  wallet: string,
  courseId: string,
): void {
  const ls = safe();
  if (!ls) return;
  ls.setItem(enrollmentKey(wallet, courseId), "1");
}

export function setStubCredential(
  wallet: string,
  courseId: string,
  id: string,
): void {
  const ls = safe();
  if (!ls) return;
  ls.setItem(credentialKey(wallet, courseId), id);
}

export function addStubXp(wallet: string, amount: number): number {
  const ls = safe();
  if (!ls) return 0;
  const prev = getStubXp(wallet);
  const next = prev + amount;
  ls.setItem(xpKey(wallet), String(next));
  return next;
}
