/**
 * Why a build request ended without a compiler verdict. `/api/build-program`
 * sends one with every failure; the editor picks its copy from it.
 *
 * - `unavailable`: the build service could not be reached or answered with an
 *   error of its own.
 * - `busy`: its queue is full, or the caller is over the build rate limit.
 * - `timeout`: the build did not finish in time.
 * - `rejected`: the request itself was refused, with a message the learner can
 *   act on.
 */
export const BUILD_FAILURE_KINDS = [
  "unavailable",
  "busy",
  "rejected",
  "timeout",
] as const;

export type BuildFailureKind = (typeof BUILD_FAILURE_KINDS)[number];

/** The kinds that say nothing about the learner's code. */
export type BuildServiceFailure = Exclude<BuildFailureKind, "rejected">;

export function isBuildFailureKind(value: unknown): value is BuildFailureKind {
  return (
    typeof value === "string" &&
    (BUILD_FAILURE_KINDS as readonly string[]).includes(value)
  );
}
