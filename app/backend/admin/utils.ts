/**
 * Admin utility functions.
 *
 * Shared helpers used across admin pages and API routes.
 */

/** Default page size for admin lists */
export const ADMIN_PAGE_SIZE = 20;

/** Number of recent audit log entries to show in activity feed */
export const ADMIN_ACTIVITY_LIMIT = 20;

/** Get start of today (midnight, local time) for date-range queries */
export function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}
