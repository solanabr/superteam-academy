/**
 * Parse a human-readable duration string into total minutes.
 *
 * Supported formats:
 *   "15 min", "15 minutes", "15m"
 *   "1.5 hours", "2 hours", "1h", "1 hr"
 *   "2h 30m", "1 hour 15 min", "1h30m"
 *
 * Returns 0 for unparseable strings.
 */
export function parseDurationToMinutes(str: string): number {
  if (!str) return 0;
  const s = str.trim().toLowerCase();

  let totalMinutes = 0;

  // Match hours component: "2h", "1.5 hours", "1 hour", "1 hr", "1h30m"
  const hoursMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)(?=[^a-z]|$)/);
  if (hoursMatch) {
    totalMinutes += parseFloat(hoursMatch[1]) * 60;
  }

  // Match minutes component: "30m", "30 min", "30 minutes"
  const minsMatch = s.match(
    /(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)(?=[^a-z]|$)/,
  );
  if (minsMatch) {
    totalMinutes += parseFloat(minsMatch[1]);
  }

  // If nothing matched, try bare number (assume hours for >=1, minutes for <1)
  if (!hoursMatch && !minsMatch) {
    const bareMatch = s.match(/^(\d+(?:\.\d+)?)$/);
    if (bareMatch) {
      const val = parseFloat(bareMatch[1]);
      totalMinutes = val >= 1 ? val * 60 : val;
    }
  }

  return Math.round(totalMinutes);
}

/**
 * Format a number of minutes into a human-readable duration string.
 *
 * Examples:
 *   30  → "30 min"
 *   60  → "1 hour"
 *   90  → "1 hour 30 min"
 *   150 → "2 hours 30 min"
 *   120 → "2 hours"
 */
export function formatMinutesToDuration(minutes: number): string {
  if (minutes <= 0) return "0 min";

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${mins} min`;
}
