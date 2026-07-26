// Client-side persistence of a successful on-chain deploy to the server, which
// is the SOURCE OF TRUTH for `deployed_programs` (localStorage is only an
// optimistic cache). The capstone credential gate (LX-E2) reads that table, so
// a save that silently fails would later deny a legitimate capstone with no
// error surfaced anywhere (#622). This module classifies the save outcome and
// retries transient failures with backoff; the panel surfaces the result.

export type SaveStatus =
  | "saving"
  | "retrying"
  | "saved"
  | "retryable"
  | "rejected";

/** Terminal outcome of a save (excludes the in-flight "saving"/"retrying"). */
export type SaveOutcome = Extract<
  SaveStatus,
  "saved" | "retryable" | "rejected"
>;

export interface SaveDeploymentParams {
  lessonId: string;
  courseId: string;
  programId: string;
}

export interface SaveDeploymentOptions {
  /** Backoff before each retry, in ms. Length = max auto-retries after the
   *  first attempt. Defaults to {@link RETRY_DELAYS_MS}. */
  delaysMs?: number[];
  /** Reports each status transition so the UI can reflect progress. */
  onStatus?: (status: SaveStatus) => void;
  /** Aborts the loop between steps (e.g. component unmounted). */
  isCancelled?: () => boolean;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
  /** Injectable for tests; defaults to setTimeout. */
  sleep?: (ms: number) => Promise<void>;
}

// Base ~2s, doubling: three auto-retries absorb the RPC-lag / rate-limit /
// 503-on-RPC-down windows that #620's server verification made real, without
// hammering a route that meters platform-funded RPC reads.
export const RETRY_DELAYS_MS = [2_000, 4_000, 8_000];

const SAVE_ENDPOINT = "/api/deploy/save";

/**
 * Map an HTTP status (or `null` for a network/throw) to a terminal outcome.
 * We map on STATUS, not body text: the route returns one generic error for
 * every on-chain rejection by design (#560), so text carries no signal.
 *
 * - 2xx            → saved
 * - 429 / 5xx / network → retryable (transient: rate limit, RPC down, DB blip)
 * - other 4xx      → rejected (verification / wallet-mismatch — retrying the
 *                    same request won't help until the learner fixes it)
 */
export function classifySaveResponse(status: number | null): SaveOutcome {
  if (status !== null && status >= 200 && status < 300) return "saved";
  if (status === null || status === 429 || status >= 500) return "retryable";
  return "rejected";
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST the deploy to the server, retrying transient failures with backoff.
 * Resolves to the terminal outcome; `onStatus` reports intermediate states.
 */
export async function saveDeploymentWithRetry(
  params: SaveDeploymentParams,
  options: SaveDeploymentOptions = {}
): Promise<SaveOutcome> {
  const {
    delaysMs = RETRY_DELAYS_MS,
    onStatus,
    isCancelled,
    fetchImpl = fetch,
    sleep = defaultSleep,
  } = options;

  const body = JSON.stringify({
    lessonId: params.lessonId,
    courseId: params.courseId,
    programId: params.programId,
  });

  for (let attempt = 0; ; attempt++) {
    if (isCancelled?.()) return "retryable";
    onStatus?.(attempt === 0 ? "saving" : "retrying");

    let status: number | null;
    try {
      const res = await fetchImpl(SAVE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      status = res.status;
    } catch {
      status = null; // network error — transient, retryable
    }

    if (isCancelled?.()) return "retryable";

    const outcome = classifySaveResponse(status);
    if (outcome === "saved") {
      onStatus?.("saved");
      return "saved";
    }
    if (outcome === "rejected") {
      onStatus?.("rejected");
      return "rejected";
    }

    // Retryable: back off and try again until the schedule is exhausted.
    if (attempt >= delaysMs.length) {
      onStatus?.("retryable");
      return "retryable";
    }
    await sleep(delaysMs[attempt] ?? 0);
  }
}
