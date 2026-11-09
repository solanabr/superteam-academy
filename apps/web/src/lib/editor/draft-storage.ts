/**
 * Where the lesson editor keeps a learner's unsubmitted code. Each signed-in
 * user has their own drafts and signed-out use has one set of its own, so a
 * second account on a shared browser never opens or runs the first one's code.
 *
 * Drafts saved before the key named its owner sit on the lesson-only key. The
 * first signed-in user to open that lesson takes it, once, and it is deleted;
 * signed-out use leaves it where it is. Most of those drafts belong to the one
 * learner who uses the browser, and this keeps them without letting more than
 * one account ever see a given one.
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

/** The draft to show, or null for the starter. Writes nothing. */
export function readDraft(
  lessonId: string,
  scope: string | undefined,
  userId: UserId
): string | null {
  const own = get(draftKey(lessonId, scope, userId));
  if (own !== null) return own || null;
  return userId ? get(legacyKey(lessonId, scope)) || null : null;
}

/** As readDraft, and moves a legacy draft to this user's key. */
export function restoreDraft(
  lessonId: string,
  scope: string | undefined,
  userId: UserId
): string | null {
  const draft = readDraft(lessonId, scope, userId);
  const key = draftKey(lessonId, scope, userId);
  if (userId && get(key) === null) {
    const legacy = get(legacyKey(lessonId, scope));
    if (legacy !== null) {
      try {
        localStorage.setItem(key, legacy);
        localStorage.removeItem(legacyKey(lessonId, scope));
      } catch {
        // Left in place; the next open tries again.
      }
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
