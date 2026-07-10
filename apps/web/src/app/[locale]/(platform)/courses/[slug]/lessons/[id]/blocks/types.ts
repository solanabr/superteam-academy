import type { JSX } from "react";
import type { Lesson, LessonBlock } from "@/lib/sanity/types";

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
  /** Latest successful build (for deployable code + the deployed-program card). */
  buildUuid: string | null;
  programKeypairSecret: number[] | null;
  /** Clear the current build (deploy panel `onBuildExpired`). */
  resetBuild: () => void;
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
