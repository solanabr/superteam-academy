import type { JSX, ReactNode } from "react";
import type { Lesson, LessonBlock } from "@superteam-lms/types";

/**
 * Shared context every block renderer receives. Interactive blocks contribute a
 * proof via `setProof(block.key, proof)`; the "complete" action submits the
 * collected proofs to the inverted completion gate (spec §7.2). Block results
 * are transient — never persisted.
 */
export interface BlockContext {
  lesson: Lesson;
  courseSlug: string;
  courseId: string;
  locale: string;
  isEnrolled: boolean;
  isCompleted: boolean;
  xpReward: number;
  earnedXp: number | null;
  onEnroll: () => void;
  /** Record a per-block proof keyed by the block `key`. */
  setProof: (blockKey: string, proof: unknown) => void;
  /**
   * Report whether a quiz block is "answered" (every question checked at least
   * once). Drives AI-partner suppression in mixed code+quiz lessons: retrieval
   * stays AI-free until the learner has attempted it (F18, #564).
   */
  setQuizAnswered: (blockKey: string, answered: boolean) => void;
  /**
   * True while any quiz block in this lesson is still unanswered — the code
   * block threads it to ChallengeInterface, which keeps the AI Partner hidden.
   */
  aiSuppressed: boolean;
  /**
   * True on THE graded capstone lesson (#867) — derived from
   * `lib/credentials/capstone-identity`, the same constant the credential gate
   * uses. Unlike `aiSuppressed` this is permanent and explained: the code block
   * threads it to ChallengeInterface, which renders the AI-free rationale where
   * the AI Partner would sit. The server refuses independently
   * (`/api/ai/partner`) — this is presentation, not the enforcement.
   */
  capstoneAiOff: boolean;
  /** Latest successful build (for deployable code + the deployed-program card). */
  buildUuid: string | null;
  programKeypairSecret: number[] | null;
  /** Clear the current build (deploy panel `onBuildExpired`). */
  resetBuild: () => void;
  /**
   * Challenge lessons only: the non-code "instructions" blocks (prose, etc.),
   * pre-rendered by `lesson-client` and threaded into the code block so the
   * description renders inside the IDE's side rail alongside the test cases,
   * rather than stacked full-width above a squeezed editor.
   */
  instructionsSlot?: ReactNode;
  /** Disclosure sections (Topics/Hints/Discussion) rendered BELOW the AI pane (#942). */
  sectionsSlot?: ReactNode;
}

export interface BlockRenderProps {
  block: LessonBlock;
  ctx: BlockContext;
}

/**
 * A block renderer. A missing renderer is a COMPILE error via
 * `satisfies Record<BlockType, Renderer>` (the render-side mirror of the grader
 * map). Dispatch is by `block._type`, so each renderer narrows its own variant.
 */
export type Renderer = (props: BlockRenderProps) => JSX.Element | null;
