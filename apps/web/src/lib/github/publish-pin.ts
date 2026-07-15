import type { ChecksState } from "./types";

/**
 * SP3-B publish-pin: the pure drift/verdict + PR-link helpers behind the
 * `/admin/publish` "Content pin" card. The pin bump is a ONE-LINE HUMAN PR —
 * these helpers only describe the drift and build the exact diff + a prefilled
 * PR link. Nothing here performs (or enables) a server-side repo write; the
 * admin route that consumes them holds no write token (spec rev-2, locked).
 */

/** The content source repo `apps/web/content.lock` pins (a courses commit). */
export const CONTENT_REPO = "solanabr/courses-academy";
/** The app repo the one-line `content.lock` bump PR is opened against. */
export const APP_REPO = "solanabr/superteam-academy";
/** Repo-relative path of the pin file the bump edits. */
export const LOCK_PATH = "apps/web/content.lock";

export type PublishVerdictState = "up_to_date" | "behind" | "unknown";

export interface PublishVerdict {
  state: PublishVerdictState;
  /** Commits HEAD is ahead of the pin (compare `ahead_by`); null if unknown. */
  commitsBehind: number | null;
  /** HEAD's combined CI state — bumping to a red HEAD is warned against. */
  headChecks: ChecksState;
  /** True when drifted AND HEAD's CI is not green: warn before bumping. */
  warnRedHead: boolean;
}

/**
 * The drift verdict: pin == HEAD is up-to-date; otherwise "N commits behind"
 * (from the compare `ahead_by`, or null when that call was skipped/failed).
 * A drifted HEAD whose CI is not `success` sets `warnRedHead` — the UI must
 * discourage bumping to unverified content.
 */
export function computePublishVerdict(input: {
  pinnedSha: string;
  headSha: string;
  aheadBy: number | null;
  headChecks: ChecksState;
}): PublishVerdict {
  if (input.pinnedSha === input.headSha) {
    return {
      state: "up_to_date",
      commitsBehind: 0,
      headChecks: input.headChecks,
      warnRedHead: false,
    };
  }
  return {
    state: "behind",
    commitsBehind: input.aheadBy,
    headChecks: input.headChecks,
    warnRedHead: input.headChecks !== "success",
  };
}

/** Short 7-char SHA for display, or an em-dash when absent. */
export function shortSha(sha: string | null | undefined): string {
  return sha ? sha.slice(0, 7) : "—";
}

/** Link to the content repo tree browsed at a specific commit. */
export function contentTreeUrl(sha: string): string {
  return `https://github.com/${CONTENT_REPO}/tree/${sha}`;
}

/** Link to a single content-repo commit. */
export function contentCommitUrl(sha: string): string {
  return `https://github.com/${CONTENT_REPO}/commit/${sha}`;
}

/** Compare view of the commits a bump would pull in (pin → HEAD). */
export function contentCompareUrl(pinnedSha: string, headSha: string): string {
  return `https://github.com/${CONTENT_REPO}/compare/${pinnedSha}...${headSha}`;
}

/**
 * Suggested branch name for the bump PR, e.g. `chore/content-pin-a1b2c3d4e5f6`.
 * Uses a 12-hex-char prefix (wider than the 7-char display `shortSha`) so two
 * distinct HEADs cannot collide onto the same branch and dead-409 each other.
 */
export function suggestBranchName(headSha: string): string {
  return `chore/content-pin-${headSha.slice(0, 12)}`;
}

/** The exact one-line `content.lock` edit the human PR makes (old → new sha). */
export function buildLockDiff(oldSha: string, newSha: string): string {
  return [
    `--- a/${LOCK_PATH}`,
    `+++ b/${LOCK_PATH}`,
    `-  "sha": "${oldSha}"`,
    `+  "sha": "${newSha}"`,
  ].join("\n");
}

/** The local command that rebuilds the committed bundle from the new pin. */
export const COMPILE_COMMAND = "pnpm --filter web compile-content";

/** Copyable PR title for the bump. */
export function buildPrTitle(headSha: string): string {
  return `chore(content): bump content.lock to ${shortSha(headSha)}`;
}

/** Copyable PR body: what changed, the pin transition, and the rebuild step. */
export function buildPrBody(input: {
  pinnedSha: string;
  headSha: string;
  commitsBehind: number | null;
}): string {
  const behind =
    input.commitsBehind == null
      ? ""
      : `\n\nPulls in ${input.commitsBehind} commit(s) from ${CONTENT_REPO}.`;
  return (
    `Bump \`${LOCK_PATH}\` pin from \`${shortSha(input.pinnedSha)}\` to ` +
    `\`${shortSha(input.headSha)}\` and regenerate the committed content ` +
    `bundle.${behind}\n\n` +
    `Steps:\n` +
    `1. Edit \`${LOCK_PATH}\`: set \`"sha"\` to \`${input.headSha}\`.\n` +
    `2. Run \`${COMPILE_COMMAND}\`.\n` +
    `3. Commit both \`${LOCK_PATH}\` and \`apps/web/src/content/generated/\`.\n\n` +
    `Compare: ${contentCompareUrl(input.pinnedSha, input.headSha)}`
  );
}

/**
 * PR body for the one-click publish route: the bundle is ALREADY bumped +
 * regenerated in the branch's single commit (unlike `buildPrBody`, which lists
 * manual steps). States the pin transition and links the content compare.
 */
export function buildOpenPrBody(input: {
  pinnedSha: string;
  headSha: string;
  commitsBehind: number | null;
}): string {
  const behind =
    input.commitsBehind == null
      ? ""
      : ` (${input.commitsBehind} commit(s) from ${CONTENT_REPO})`;
  return (
    `Automated content pin bump: \`${LOCK_PATH}\` \`${shortSha(input.pinnedSha)}\` → ` +
    `\`${shortSha(input.headSha)}\`${behind}, with the committed bundle ` +
    `regenerated in the same commit.\n\n` +
    `The CI "Content bundle freshness" check recompiles and diffs the bundle on ` +
    `this branch; merge only once it is green.\n\n` +
    `Compare: ${contentCompareUrl(input.pinnedSha, input.headSha)}`
  );
}

/**
 * Prefilled "new PR" link on the APP repo compare page. GitHub prefills the
 * PR form's title/body from the query params; the contributor selects their
 * pushed branch there. This link performs NO write — it only opens the form.
 */
export function buildPublishPrUrl(input: {
  pinnedSha: string;
  headSha: string;
}): string {
  const params = new URLSearchParams({
    quick_pull: "1",
    expand: "1",
    title: buildPrTitle(input.headSha),
    body: buildPrBody({
      pinnedSha: input.pinnedSha,
      headSha: input.headSha,
      commitsBehind: null,
    }),
  });
  return `https://github.com/${APP_REPO}/compare/main?${params.toString()}`;
}
