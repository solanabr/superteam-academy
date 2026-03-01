/**
 * Server-side only — parse Anchor events from transaction log messages.
 *
 * Anchor events are emitted as "Program data: <base64>" log lines.
 * Each line decodes to: 8-byte discriminator + Borsh-encoded fields.
 * Discriminators = sha256("event:<EventName>")[0:8]
 */

import { createHash } from "crypto";
import { PublicKey } from "@solana/web3.js";

function disc(eventName: string): Buffer {
  return Buffer.from(
    createHash("sha256").update(`event:${eventName}`).digest()
  ).subarray(0, 8);
}

// Precompute discriminators once at module load
const DISC_LESSON_COMPLETED = disc("LessonCompleted");
const DISC_COURSE_FINALIZED = disc("CourseFinalized");
const DISC_CREDENTIAL_ISSUED = disc("CredentialIssued");
const DISC_CREDENTIAL_UPGRADED = disc("CredentialUpgraded");

export interface LessonCompletedEvent {
  lessonIndex: number;
  xpEarned: number;
}

export interface CourseFinalizedEvent {
  totalXp: number;
  bonusXp: number;
  creatorXp: number;
}

export interface CredentialIssuedEvent {
  asset: string;
}

export interface CredentialUpgradedEvent {
  asset: string;
}

export interface ParsedProgramEvents {
  lessonCompleted?: LessonCompletedEvent;
  courseFinalized?: CourseFinalizedEvent;
  credentialIssued?: CredentialIssuedEvent;
  credentialUpgraded?: CredentialUpgradedEvent;
}

/**
 * Parse known program events from a transaction's log messages.
 * Pass `tx.meta?.logMessages ?? []` from a confirmed transaction.
 *
 * Layouts (all offsets relative to start of decoded buffer):
 *  LessonCompleted:  [8] disc | [32] learner | [32] course | [1] lessonIndex | [4] xpEarned u32 | [8] timestamp
 *  CourseFinalized:  [8] disc | [32] learner | [32] course | [4] totalXp u32 | [4] bonusXp u32 | [32] creator | [4] creatorXp u32 | [8] ts
 *  CredentialIssued:   [8] disc | [32] learner | [32] course | [32] asset | [2] trackId | [8] ts
 *  CredentialUpgraded: [8] disc | [32] learner | [32] asset | [1] coursesCompleted | [8] totalXp | [8] ts
 */
export function parseEventsFromLogs(logs: string[]): ParsedProgramEvents {
  const result: ParsedProgramEvents = {};

  for (const line of logs) {
    if (!line.startsWith("Program data: ")) continue;

    let data: Buffer;
    try {
      data = Buffer.from(line.slice("Program data: ".length), "base64");
    } catch {
      continue;
    }
    if (data.length < 8) continue;

    const d = data.subarray(0, 8);

    if (d.equals(DISC_LESSON_COMPLETED) && data.length >= 8 + 32 + 32 + 1 + 4) {
      result.lessonCompleted = {
        lessonIndex: data.readUInt8(8 + 32 + 32),
        xpEarned: data.readUInt32LE(8 + 32 + 32 + 1),
      };
    } else if (d.equals(DISC_COURSE_FINALIZED) && data.length >= 8 + 32 + 32 + 4 + 4 + 32 + 4) {
      result.courseFinalized = {
        totalXp: data.readUInt32LE(8 + 32 + 32),
        bonusXp: data.readUInt32LE(8 + 32 + 32 + 4),
        creatorXp: data.readUInt32LE(8 + 32 + 32 + 4 + 4 + 32),
      };
    } else if (d.equals(DISC_CREDENTIAL_ISSUED) && data.length >= 8 + 32 + 32 + 32) {
      result.credentialIssued = {
        asset: new PublicKey(data.subarray(8 + 32 + 32, 8 + 32 + 32 + 32)).toBase58(),
      };
    } else if (d.equals(DISC_CREDENTIAL_UPGRADED) && data.length >= 8 + 32 + 32) {
      // learner (32) + asset (32)
      result.credentialUpgraded = {
        asset: new PublicKey(data.subarray(8 + 32, 8 + 32 + 32)).toBase58(),
      };
    }
  }

  return result;
}
