/**
 * Where the lesson editor keeps a learner's unsubmitted code. Each signed-in
 * user has their own drafts and signed-out use has one set of its own, so a
 * second account on a shared browser never opens or runs the first one's code.
 *
 * A signed-in user who opens a lesson part with no draft of their own takes
 * one over, once: it moves to their key and the source is deleted, so no other
 * account ever sees it. Signed-out use takes nothing over.
 * - The signed-out draft comes first. It is the newer of the two, and it is
 *   usually what this learner did just before signing in, which reloads the
 *   page.
 * - Otherwise the lesson-only key, where every draft was saved before keys
 *   named an owner. Most of those belong to the one learner who uses the
 *   browser.
 * A user who already has a draft keeps it, and both sources stay where they
 * are.
 *
 * Every access is wrapped: localStorage can be missing or throw.
 */

type UserId = string | null | undefined;

function legacyKey(lessonId: string, scope?: string): string {
  const key = `superteam-lms-code-${lessonId}`;
  return scope ? `${key}::${scope}` : key;
}

export function draftKey(
  lessonId: string,
  scope: string | undefined,
  userId: UserId
): string {
  return `${legacyKey(lessonId, scope)}@${userId ? `user:${userId}` : "anon"}`;
}

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** The key a user with no draft of their own would take over, if any. */
function claimableKey(
  lessonId: string,
  scope: string | undefined,
  userId: UserId
): string | null {
  if (!userId || get(draftKey(lessonId, scope, userId)) !== null) return null;
  for (const key of [
    draftKey(lessonId, scope, null),
    legacyKey(lessonId, scope),
  ]) {
    if (get(key) !== null) return key;
  }
  return null;
}

/** The draft to show, or null for the starter. Writes nothing. */
export function readDraft(
  lessonId: string,
  scope: string | undefined,
  userId: UserId
): string | null {
  const source =
    claimableKey(lessonId, scope, userId) ?? draftKey(lessonId, scope, userId);
  return get(source) || null;
}

/** As readDraft, and moves a draft taken over to this user's key. */
export function restoreDraft(
  lessonId: string,
  scope: string | undefined,
  userId: UserId
): string | null {
  const draft = readDraft(lessonId, scope, userId);
  const source = claimableKey(lessonId, scope, userId);
  if (source !== null) {
    try {
      localStorage.setItem(draftKey(lessonId, scope, userId), get(source)!);
      localStorage.removeItem(source);
    } catch {
      // Left in place; the next open tries again.
    }
  }
  return draft;
}

export function saveDraft(
  lessonId: string,
  scope: string | undefined,
  userId: UserId,
  code: string
): void {
  try {
    localStorage.setItem(draftKey(lessonId, scope, userId), code);
  } catch {
    // Not saved; the editor still holds the code.
  }
}

export function clearDraft(
  lessonId: string,
  scope: string | undefined,
  userId: UserId
): void {
  try {
    localStorage.removeItem(draftKey(lessonId, scope, userId));
  } catch {
    // Nothing to clear.
  }
}
