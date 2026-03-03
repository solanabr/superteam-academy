/**
 * On-chain event type definitions.
 *
 * Mapped from the Anchor IDL events section in lib/idl/onchain_academy.json.
 * All PublicKey fields are represented as strings (base58) for easy
 * serialization to Redis/Postgres.
 */

// ── Event Names ──────────────────────────────────────────────────────

export const EVENT_NAMES = [
    'Enrolled',
    'LessonCompleted',
    'CourseFinalized',
    'EnrollmentClosed',
    'CredentialIssued',
    'CredentialUpgraded',
    'XpRewarded',
    'ConfigUpdated',
    'CourseCreated',
    'CourseUpdated',
    'MinterRegistered',
    'MinterRevoked',
    'AchievementAwarded',
    'AchievementTypeCreated',
    'AchievementTypeDeactivated',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

// ── Event Payload Types (from IDL) ───────────────────────────────────

export interface EnrolledEvent {
    learner: string;
    course: string;
    courseVersion: number;
    timestamp: number;
}

export interface LessonCompletedEvent {
    learner: string;
    course: string;
    lessonIndex: number;
    xpEarned: number;
    timestamp: number;
}

export interface CourseFinalizedEvent {
    learner: string;
    course: string;
    totalXp: number;
    bonusXp: number;
    creator: string;
    creatorXp: number;
    timestamp: number;
}

export interface EnrollmentClosedEvent {
    learner: string;
    course: string;
    completed: boolean;
    rentReclaimed: number;
    timestamp: number;
}

export interface CredentialIssuedEvent {
    learner: string;
    trackId: number;
    credentialAsset: string;
    currentLevel: number;
    timestamp: number;
}

export interface CredentialUpgradedEvent {
    learner: string;
    trackId: number;
    credentialAsset: string;
    currentLevel: number;
    timestamp: number;
}

export interface XpRewardedEvent {
    minter: string;
    recipient: string;
    amount: number;
    memo: string;
    timestamp: number;
}

export interface ConfigUpdatedEvent {
    field: string;
    timestamp: number;
}

export interface CourseCreatedEvent {
    course: string;
    courseId: string;
    creator: string;
    trackId: number;
    trackLevel: number;
    timestamp: number;
}

export interface CourseUpdatedEvent {
    course: string;
    version: number;
    timestamp: number;
}

export interface MinterRegisteredEvent {
    minter: string;
    label: string;
    maxXpPerCall: number;
    timestamp: number;
}

export interface MinterRevokedEvent {
    minter: string;
    totalXpMinted: number;
    timestamp: number;
}

export interface AchievementAwardedEvent {
    achievementId: string;
    recipient: string;
    asset: string;
    xpReward: number;
    timestamp: number;
}

export interface AchievementTypeCreatedEvent {
    achievementId: string;
    collection: string;
    creator: string;
    maxSupply: number;
    xpReward: number;
    timestamp: number;
}

export interface AchievementTypeDeactivatedEvent {
    achievementId: string;
    timestamp: number;
}

// ── Union Type ───────────────────────────────────────────────────────

export type EventPayload =
    | { name: 'Enrolled'; data: EnrolledEvent }
    | { name: 'LessonCompleted'; data: LessonCompletedEvent }
    | { name: 'CourseFinalized'; data: CourseFinalizedEvent }
    | { name: 'EnrollmentClosed'; data: EnrollmentClosedEvent }
    | { name: 'CredentialIssued'; data: CredentialIssuedEvent }
    | { name: 'CredentialUpgraded'; data: CredentialUpgradedEvent }
    | { name: 'XpRewarded'; data: XpRewardedEvent }
    | { name: 'ConfigUpdated'; data: ConfigUpdatedEvent }
    | { name: 'CourseCreated'; data: CourseCreatedEvent }
    | { name: 'CourseUpdated'; data: CourseUpdatedEvent }
    | { name: 'MinterRegistered'; data: MinterRegisteredEvent }
    | { name: 'MinterRevoked'; data: MinterRevokedEvent }
    | { name: 'AchievementAwarded'; data: AchievementAwardedEvent }
    | { name: 'AchievementTypeCreated'; data: AchievementTypeCreatedEvent }
    | { name: 'AchievementTypeDeactivated'; data: AchievementTypeDeactivatedEvent };

// ── Stored Event Log ─────────────────────────────────────────────────

export interface StoredEventLog {
    id: string;
    eventType: EventName;
    txHash: string;
    slot: number;
    timestamp: number;
    data: Record<string, unknown>;
    processed: boolean;
    createdAt: Date;
}
