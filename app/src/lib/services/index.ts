import { Program, AnchorProvider } from "@coral-xyz/anchor";

import { StubEnrollmentService, OnChainEnrollmentService } from "./enrollment";
import type { IEnrollmentService } from "./enrollment";

import { StubCourseService } from "./course";
import type { ICourseService } from "./course";

import { StubXpService } from "./xp";
import type { IXpService } from "./xp";

import { StubCredentialService } from "./credential";
import type { ICredentialService } from "./credential";

import { StubLessonService, OnChainLessonService } from "./lesson";
import type { ILessonService } from "./lesson";

export type { IEnrollmentService } from "./enrollment";
export type { ICourseService } from "./course";
export type { IXpService } from "./xp";
export type { ICredentialService } from "./credential";
export type { ILessonService } from "./lesson";

export type {
  CourseData,
  EnrollmentData,
  CredentialData,
  LeaderboardEntry,
  TransactionResult,
} from "./types";

// ---------------------------------------------------------------------------
// Service container
// ---------------------------------------------------------------------------

export interface Services {
  enrollment: IEnrollmentService;
  course: ICourseService;
  xp: IXpService;
  credential: ICredentialService;
  lesson: ILessonService;
}

// ---------------------------------------------------------------------------
// Factory
//
// Set NEXT_PUBLIC_USE_STUBS=true in .env to use stub implementations.
// Omit or set to any other value to use on-chain implementations.
//
// On-chain services require an Anchor Program and AnchorProvider. Pass them
// when calling createServices() in contexts where a wallet is connected.
// ---------------------------------------------------------------------------

const USE_STUBS =
  process.env.NEXT_PUBLIC_USE_STUBS === "true";

// ---------------------------------------------------------------------------
// Singleton stub factory
//
// getServices() returns a stable stub-backed Services object that is safe to
// call from React hooks before a wallet connects. Use createServices() when
// you need on-chain implementations bound to a live provider.
// ---------------------------------------------------------------------------

let _stubInstance: Services | null = null;

export function getServices(): Services {
  if (!_stubInstance) {
    _stubInstance = {
      enrollment: new StubEnrollmentService(),
      course: new StubCourseService(),
      xp: new StubXpService(),
      credential: new StubCredentialService(),
      lesson: new StubLessonService(),
    };
  }
  return _stubInstance;
}

export function createServices(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program?: Program<any>,
  provider?: AnchorProvider
): Services {
  if (USE_STUBS) {
    return {
      enrollment: new StubEnrollmentService(),
      course: new StubCourseService(),
      xp: new StubXpService(),
      credential: new StubCredentialService(),
      lesson: new StubLessonService(),
    };
  }

  if (!program || !provider) {
    throw new Error(
      "createServices: program and provider are required when NEXT_PUBLIC_USE_STUBS is not true"
    );
  }

  return {
    enrollment: new OnChainEnrollmentService(program, provider),
    course: new StubCourseService(),   // Course data is read-only; stub is sufficient until a CMS is wired up
    xp: new StubXpService(),           // XP balance is queried via Token-2022 ATA; swap for a real impl once RPC is configured
    credential: new StubCredentialService(), // Credentials are queried via Helius DAS; swap once API key is configured
    lesson: new OnChainLessonService(program, provider),
  };
}
