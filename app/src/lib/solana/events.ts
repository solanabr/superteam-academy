import type { IdlEvents } from "@coral-xyz/anchor";
import type { Commitment } from "@solana/web3.js";
import type { OnchainAcademy } from "./types";
import { program } from "./program";

// Anchor's IdlEvents<T> keys are camelCase, but the BorshEventCoder builds its
// layout map keyed by ev.name from the IDL (PascalCase), so the runtime listener
// lookup also uses PascalCase. Map our exported types to PascalCase for consistency.
type CamelEvents = IdlEvents<OnchainAcademy>;
export type ProgramEvents = {
  [K in keyof CamelEvents as Capitalize<string & K>]: CamelEvents[K];
};
export type ProgramEventName = keyof ProgramEvents;

// Re-type `program` once at the module boundary so that addEventListener/removeEventListener
// accept PascalCase event names matching ProgramEventName. This is the single point where
// the Anchor type/runtime mismatch is bridged — all downstream code is strictly typed.
const typedProgram = program as unknown as {
  addEventListener<E extends ProgramEventName>(
    eventName: E,
    callback: (event: ProgramEvents[E], slot: number, signature: string) => void,
    commitment?: Commitment,
  ): number;
  removeEventListener(listenerId: number): Promise<void>;
};

// Re-export individual event types (PascalCase — matches IDL source)
export type AchievementAwardedEvent = ProgramEvents["AchievementAwarded"];
export type AchievementTypeCreatedEvent = ProgramEvents["AchievementTypeCreated"];
export type AchievementTypeDeactivatedEvent = ProgramEvents["AchievementTypeDeactivated"];
export type ConfigUpdatedEvent = ProgramEvents["ConfigUpdated"];
export type CourseCreatedEvent = ProgramEvents["CourseCreated"];
export type CourseFinalizedEvent = ProgramEvents["CourseFinalized"];
export type CourseUpdatedEvent = ProgramEvents["CourseUpdated"];
export type CredentialIssuedEvent = ProgramEvents["CredentialIssued"];
export type CredentialUpgradedEvent = ProgramEvents["CredentialUpgraded"];
export type EnrolledEvent = ProgramEvents["Enrolled"];
export type EnrollmentClosedEvent = ProgramEvents["EnrollmentClosed"];
export type LessonCompletedEvent = ProgramEvents["LessonCompleted"];
export type MinterRegisteredEvent = ProgramEvents["MinterRegistered"];
export type MinterRevokedEvent = ProgramEvents["MinterRevoked"];
export type XpRewardedEvent = ProgramEvents["XpRewarded"];

// Event subscription service
export type EventCallback<E extends ProgramEventName> = (
  event: ProgramEvents[E],
  slot: number,
  signature: string,
) => void;

export function subscribeToEvent<E extends ProgramEventName>(
  eventName: E,
  callback: EventCallback<E>,
): number | null {
  try {
    return typedProgram.addEventListener(eventName, callback);
  } catch {
    return null;
  }
}

export function unsubscribeFromEvent(listenerId: number): void {
  typedProgram.removeEventListener(listenerId).catch(() => {});
}
