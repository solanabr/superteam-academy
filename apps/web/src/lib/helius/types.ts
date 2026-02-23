/**
 * Helius raw webhook payload types.
 * Raw webhooks deliver the full Solana transaction as-is.
 * Ref: https://docs.helius.dev/webhooks/webhook-types#raw
 */

/** A single raw transaction as delivered by Helius */
export interface HeliusRawTransaction {
  /** Full transaction object from Solana RPC */
  transaction: {
    signatures: string[];
    message: {
      accountKeys: string[];
      instructions: {
        programIdIndex: number;
        accounts: number[];
        data: string;
      }[];
      recentBlockhash: string;
    };
  };
  meta: {
    err: null | Record<string, unknown>;
    fee: number;
    preBalances: number[];
    postBalances: number[];
    logMessages: string[];
    innerInstructions: {
      index: number;
      instructions: {
        programIdIndex: number;
        accounts: number[];
        data: string;
      }[];
    }[];
  } | null;
}

/** The webhook POST body is an array of transactions */
export type HeliusWebhookPayload = HeliusRawTransaction[];

/** Decoded Anchor event with typed data */
export interface DecodedEvent<T = Record<string, unknown>> {
  name: string;
  data: T;
}

/** Typed event data for each program event */
export interface LessonCompletedEvent {
  learner: string;
  course: string;
  lessonIndex: number;
  xpEarned: number;
  timestamp: number;
}

export interface EnrolledEvent {
  learner: string;
  course: string;
  courseVersion: number;
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

export interface AchievementAwardedEvent {
  achievementId: string;
  recipient: string;
  asset: string;
  xpReward: number;
  timestamp: number;
}

export interface XpRewardedEvent {
  minter: string;
  recipient: string;
  amount: number;
  memo: string;
  timestamp: number;
}
