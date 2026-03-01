/**
 * On-chain program event types emitted by the Superteam Academy program.
 * Events are encoded in transaction logs as base64-prefixed data after
 * the "Program data:" anchor event discriminator.
 */

export type ProgramEventType =
  | 'EnrollmentCreated'
  | 'LessonCompleted'
  | 'CourseFinalized'
  | 'CredentialIssued'
  | 'AchievementAwarded';

interface BaseEvent {
  type: ProgramEventType;
  timestamp: number;
  signature: string;
  slot: number;
}

export interface EnrollmentCreatedEvent extends BaseEvent {
  type: 'EnrollmentCreated';
  learner: string;
  courseId: string;
}

export interface LessonCompletedEvent extends BaseEvent {
  type: 'LessonCompleted';
  learner: string;
  courseId: string;
  lessonIndex: number;
  xpAwarded: number;
}

export interface CourseFinalizedEvent extends BaseEvent {
  type: 'CourseFinalized';
  learner: string;
  courseId: string;
  totalXp: number;
}

export interface CredentialIssuedEvent extends BaseEvent {
  type: 'CredentialIssued';
  recipient: string;
  courseId: string;
  assetId: string;
}

export interface AchievementAwardedEvent extends BaseEvent {
  type: 'AchievementAwarded';
  recipient: string;
  achievementId: string;
  xpAwarded: number;
}

export type ProgramEvent =
  | EnrollmentCreatedEvent
  | LessonCompletedEvent
  | CourseFinalizedEvent
  | CredentialIssuedEvent
  | AchievementAwardedEvent;

/**
 * Known Anchor event discriminators for log parsing.
 * In production these would be derived from the IDL's event hashes.
 * For now, we match against log string patterns.
 */
const EVENT_PATTERNS: Record<ProgramEventType, RegExp> = {
  EnrollmentCreated: /EnrollmentCreated/,
  LessonCompleted: /LessonCompleted/,
  CourseFinalized: /CourseFinalized/,
  CredentialIssued: /CredentialIssued/,
  AchievementAwarded: /AchievementAwarded/,
};

/**
 * Attempts to parse a program event from a transaction log line.
 * Returns null if the line doesn't contain a recognized event.
 *
 * In production, this would decode the base64 event data using
 * the Anchor event coder. For now, it matches against string patterns
 * and returns a typed stub that downstream consumers can use.
 */
export function parseEventFromLog(
  log: string,
  signature: string,
  slot: number,
): ProgramEvent | null {
  const now = Date.now();

  for (const [eventType, pattern] of Object.entries(EVENT_PATTERNS)) {
    if (pattern.test(log)) {
      const base: BaseEvent = {
        type: eventType as ProgramEventType,
        timestamp: now,
        signature,
        slot,
      };

      switch (eventType as ProgramEventType) {
        case 'EnrollmentCreated':
          return {
            ...base,
            type: 'EnrollmentCreated',
            learner: '',
            courseId: '',
          };
        case 'LessonCompleted':
          return {
            ...base,
            type: 'LessonCompleted',
            learner: '',
            courseId: '',
            lessonIndex: 0,
            xpAwarded: 0,
          };
        case 'CourseFinalized':
          return {
            ...base,
            type: 'CourseFinalized',
            learner: '',
            courseId: '',
            totalXp: 0,
          };
        case 'CredentialIssued':
          return {
            ...base,
            type: 'CredentialIssued',
            recipient: '',
            courseId: '',
            assetId: '',
          };
        case 'AchievementAwarded':
          return {
            ...base,
            type: 'AchievementAwarded',
            recipient: '',
            achievementId: '',
            xpAwarded: 0,
          };
      }
    }
  }

  return null;
}

/**
 * Parses all events from an array of transaction log messages.
 */
export function parseEventsFromLogs(
  logs: string[],
  signature: string,
  slot: number,
): ProgramEvent[] {
  const events: ProgramEvent[] = [];

  for (const log of logs) {
    const event = parseEventFromLog(log, signature, slot);
    if (event) {
      events.push(event);
    }
  }

  return events;
}
