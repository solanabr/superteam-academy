/**
 * Local bank of lesson completions earned while signed OUT (LX-A4c).
 *
 * An anonymous learner can do the graded work — pass a challenge, answer a quiz,
 * read a prose/video lesson — but cannot POST `/api/lessons/complete` (it 401s).
 * Rather than lose that work at the sign-in wall, we keep the exact `proofs`
 * payload the completion POST would have carried in `localStorage`, framed as
 * "saved on this device" (never discarded — F4). On sign-in it replays into the
 * completion route, which re-grades every proof server-side (see replay-banked).
 *
 * What is stored is only what the client already computed for the live POST:
 * challenge code, quiz selections, and — for reflection blocks — the sealed
 * attestation token. Those seals are minted by `/api/lessons/reflect`, which
 * itself requires auth AND binds the seal to the caller's `userId`, so an
 * anonymous session never obtains one: reflection lessons simply won't carry a
 * usable proof and will replay as incomplete. That is the honest outcome — the
 * bank never forges a proof, and expiry is enforced server-side, not faked here.
 */

const STORAGE_KEY = "superteam:progress-bank:v1";

// Storage hygiene only. Entries older than this are dropped on read so an
// abandoned bank cannot grow without bound. It is deliberately unrelated to the
// 24h attestation-seal TTL — a banked seal older than 24h is rejected by the
// server regardless of whether the entry is still here; code/quiz proofs never
// expire (the answers are static), so pruning is about storage, not validity.
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Bound the bank so a long anonymous session cannot fill the origin's storage
// quota. Oldest entries are dropped first; a learner who completes more than
// this many lessons before ever signing in is well past the intended flow.
const MAX_ENTRIES = 100;

export interface BankedCompletion {
  courseId: string;
  courseSlug: string;
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  /** Exactly the per-block proofs the live completion POST would carry. */
  proofs: Record<string, unknown>;
  /** Epoch ms when the work was banked — drives pruning and ordering. */
  bankedAt: number;
}

function isBankedCompletion(value: unknown): value is BankedCompletion {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.courseId === "string" &&
    typeof v.courseSlug === "string" &&
    typeof v.lessonId === "string" &&
    typeof v.lessonSlug === "string" &&
    typeof v.lessonTitle === "string" &&
    typeof v.bankedAt === "number" &&
    Number.isFinite(v.bankedAt) &&
    !!v.proofs &&
    typeof v.proofs === "object"
  );
}

function readRaw(): BankedCompletion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBankedCompletion);
  } catch {
    // Corrupt/unavailable storage (private mode, quota, garbage) → treat as empty.
    return [];
  }
}

function writeRaw(entries: BankedCompletion[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Best-effort: a storage write failure must never break the lesson flow.
  }
}

/** Banked completions, freshest first, with stale entries pruned. */
export function readBank(): BankedCompletion[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  const live = readRaw()
    .filter((e) => e.bankedAt >= cutoff)
    .sort((a, b) => b.bankedAt - a.bankedAt);
  return live.slice(0, MAX_ENTRIES);
}

export function hasBankedCompletions(): boolean {
  return readBank().length > 0;
}

/**
 * Save (or refresh) a lesson's proofs. Keyed by course+lesson so re-doing a
 * lesson before signing in overwrites rather than duplicates.
 */
export function bankCompletion(
  entry: Omit<BankedCompletion, "bankedAt">
): void {
  const others = readRaw().filter(
    (e) => !(e.courseId === entry.courseId && e.lessonId === entry.lessonId)
  );
  const next = [...others, { ...entry, bankedAt: Date.now() }]
    .sort((a, b) => b.bankedAt - a.bankedAt)
    .slice(0, MAX_ENTRIES);
  writeRaw(next);
}

export function removeBanked(courseId: string, lessonId: string): void {
  const next = readRaw().filter(
    (e) => !(e.courseId === courseId && e.lessonId === lessonId)
  );
  writeRaw(next);
}

export function clearBank(): void {
  writeRaw([]);
}
