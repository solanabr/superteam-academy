/**
 * Events and workshops (20261112120000_events.sql). Each event is an on-chain
 * achievement type whose id starts with `event-`; redeeming its code during the
 * event's window awards that achievement's NFT and XP.
 */

export const EVENT_ID_PREFIX = "event-";

/** Mirrors `events.xp_reward`'s CHECK. */
export const MAX_EVENT_XP = 500;

/** Mirrors `events.name`'s CHECK: the on-chain type name is at most 64 bytes. */
export const MAX_EVENT_NAME = 64;

export const MAX_EVENT_DESCRIPTION = 1000;

// No 0/O or 1/I, so a code read off a slide is typed right the first time.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;

/** True for a user_achievements id that belongs to an event, not a course achievement. */
export function isEventAchievementId(id: string): boolean {
  return id.startsWith(EVENT_ID_PREFIX);
}

function randomChars(alphabet: string, length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/**
 * The on-chain id for a new event: `event-` + a slug of the name + a random
 * suffix, so two events with the same name never collide. At most 32 bytes,
 * the PDA seed limit (`events.achievement_id`'s CHECK).
 */
export function eventAchievementId(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20)
    .replace(/-+$/, "");
  const suffix = randomChars("abcdefghijklmnopqrstuvwxyz0123456789", 5);
  return `${EVENT_ID_PREFIX}${slug ? `${slug}-` : ""}${suffix}`;
}

/** A fresh redeem code, `XXXX-XXXX`. */
export function generateEventCode(): string {
  const raw = randomChars(CODE_ALPHABET, 8);
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/** What a learner or admin typed, as stored: upper-case, no spaces. `null` if invalid. */
export function normalizeEventCode(input: string): string | null {
  const code = input.trim().toUpperCase().replace(/\s+/g, "");
  return CODE_PATTERN.test(code) ? code : null;
}

export type EventWindowState = "upcoming" | "live" | "ended";

export function eventWindowState(
  event: { startsAt: string | Date; endsAt: string | Date },
  now: Date = new Date()
): EventWindowState {
  if (now < new Date(event.startsAt)) return "upcoming";
  if (now >= new Date(event.endsAt)) return "ended";
  return "live";
}

/** An event a learner attended, as the profile shows it. */
export interface EventBadge {
  eventId: string;
  achievementId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string;
  redeemedAt: string;
  /** The minted NFT, once the award has landed. */
  assetAddress: string | null;
}
