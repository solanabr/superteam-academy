import { PublicKey } from "@solana/web3.js";
import { getCredentialCollections } from "@/academy/credential-collections-store.js";

/** TRACK_COLLECTIONS: JSON object mapping track ID (number) to collection pubkey string. E.g. {"1":"...","2":"..."} */
const TRACK_COLLECTIONS_RAW = process.env.TRACK_COLLECTIONS;
/** TRACK_COURSES: JSON object mapping track ID to array of course IDs in that track. E.g. {"1":["intro-solana","advanced"],"2":["other"]}. Used to find which enrollment has the credential for upgrade path. */
const TRACK_COURSES_RAW = process.env.TRACK_COURSES;

let trackCollections: Record<number, PublicKey> | null = null;
let trackCourses: Record<number, string[]> | null = null;

function parseTrackCollections(): Record<number, PublicKey> | null {
  if (trackCollections !== null) return trackCollections;
  const out: Record<number, PublicKey> = {};
  const fromStore = getCredentialCollections();
  for (const [k, v] of Object.entries(fromStore)) {
    const id = Number(k);
    if (Number.isInteger(id) && v) {
      try {
        out[id] = new PublicKey(v);
      } catch {
        /* skip invalid */
      }
    }
  }
  if (TRACK_COLLECTIONS_RAW?.trim()) {
    try {
      const obj = JSON.parse(TRACK_COLLECTIONS_RAW) as Record<string, string>;
      for (const [k, v] of Object.entries(obj)) {
        const id = Number(k);
        if (Number.isInteger(id) && v) out[id] = new PublicKey(v);
      }
    } catch {
      /* keep store-only */
    }
  }
  trackCollections = out;
  return trackCollections;
}

function parseTrackCourses(): Record<number, string[]> | null {
  if (trackCourses !== null) return trackCourses;
  if (!TRACK_COURSES_RAW?.trim()) {
    trackCourses = {};
    return trackCourses;
  }
  try {
    const obj = JSON.parse(TRACK_COURSES_RAW) as Record<string, string[]>;
    const out: Record<number, string[]> = {};
    for (const [k, v] of Object.entries(obj)) {
      const id = Number(k);
      if (Number.isInteger(id) && Array.isArray(v)) out[id] = v.filter(Boolean);
    }
    trackCourses = out;
    return trackCourses;
  } catch {
    trackCourses = {};
    return trackCourses;
  }
}

/** Returns the Metaplex Core collection pubkey for the given track ID, or null if not configured. */
export function getTrackCollection(trackId: number): PublicKey | null {
  const cols = parseTrackCollections();
  return cols ? (cols[trackId] ?? null) : null;
}

/** Returns the list of course IDs in the given track (for scanning enrollments). If not configured, returns empty array. */
export function getTrackCourseIds(trackId: number): string[] {
  const courses = parseTrackCourses();
  return courses ? (courses[trackId] ?? []) : [];
}

/** True if credential automation can run (at least one track has a collection). */
export function hasAnyTrackCollection(): boolean {
  const cols = parseTrackCollections();
  return cols ? Object.keys(cols).length > 0 : false;
}

/** Call after updating credential collections store so automation sees new collections. */
export function invalidateTrackCollectionsCache(): void {
  trackCollections = null;
}
