/**
 * How long a per-course maintenance gate holds without being refreshed. A
 * recreate runs well inside the route's 300s maxDuration, so a gate older than
 * this was left by an interrupted recreate (a killed function, a close whose
 * outcome stayed unknown) and must not lock the course forever.
 */
export const MAINTENANCE_GATE_TTL_MS = 10 * 60_000;

/** Minutes, for operator-facing messages. */
export const MAINTENANCE_GATE_TTL_MIN = MAINTENANCE_GATE_TTL_MS / 60_000;

/**
 * True when a set gate is old enough to ignore. `updatedAt` is the deployment
 * row's `updated_at`, which every write refreshes, so any write while the gate
 * is on only extends it. A missing or unparseable time is never stale.
 */
export function isMaintenanceGateStale(
  updatedAt: string | null | undefined,
  now: number = Date.now()
): boolean {
  const setAt = Date.parse(updatedAt ?? "");
  return Number.isFinite(setAt) && now - setAt > MAINTENANCE_GATE_TTL_MS;
}
