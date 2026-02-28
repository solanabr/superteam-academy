/**
 * Activity logging service for tracking recent user actions.
 *
 * Stores a capped list of user activities in localStorage for display
 * in the dashboard activity feed. Activities are recorded as side effects
 * of learning progress operations (enrollment, lesson completion, etc.).
 */

/** Types of activities that can be logged */
export type ActivityType =
  | "lesson_completed"
  | "course_completed"
  | "course_enrolled"
  | "achievement_earned"
  | "streak_milestone";

/** A single activity entry */
export interface ActivityEntry {
  id: string;
  type: ActivityType;
  timestamp: string;
  /** Metadata varies by activity type */
  meta: Record<string, string>;
}

const KEY_PREFIX = "sta_activity:";
const MAX_ENTRIES = 50;

function getActivities(userId: string): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}

function saveActivities(userId: string, activities: ActivityEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${KEY_PREFIX}${userId}`, JSON.stringify(activities));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Record a new activity for a user.
 * Activities are prepended (newest first) and capped at MAX_ENTRIES.
 */
export function recordActivity(
  userId: string,
  type: ActivityType,
  meta: Record<string, string>
): void {
  const activities = getActivities(userId);
  const entry: ActivityEntry = {
    id: generateId(),
    type,
    timestamp: new Date().toISOString(),
    meta,
  };
  activities.unshift(entry);
  if (activities.length > MAX_ENTRIES) {
    activities.length = MAX_ENTRIES;
  }
  saveActivities(userId, activities);
}

/**
 * Get recent activities for a user, newest first.
 * @param limit Maximum number of activities to return (default 10)
 */
export function getRecentActivities(
  userId: string,
  limit = 10
): ActivityEntry[] {
  return getActivities(userId).slice(0, limit);
}
