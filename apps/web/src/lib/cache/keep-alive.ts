import "server-only";

import { after } from "next/server";

/**
 * Keeps the serverless invocation alive until `work` settles.
 *
 * Wrap the network call inside an `unstable_cache` loader with this. When a
 * cached entry is stale, `unstable_cache` returns it and refreshes in the
 * background, parking the refresh in the request's pending revalidations. Next
 * hands those to `waitUntil` once, right after the streaming shell is ready
 * (`app-render.js`, Next 15.5). A page under a `loading.tsx` boundary renders
 * after that point, so its refresh is never handed over. The response ends,
 * Vercel suspends the instance with the request half-sent, and the
 * `AbortSignal.timeout` on it fires on whichever request wakes the instance
 * next. That was LESSON_COMPLETION_COUNT_001: logged 130-230 ms into unrelated
 * requests, under the wrong course id, for RPCs that mostly never reached
 * Supabase.
 *
 * `after(promise)` passes the promise straight to `waitUntil` at call time, so
 * it covers work started mid-stream too. The subsequent cache write is not
 * covered; if it is cut off, the entry stays stale and the next request
 * refreshes it again.
 *
 * Takes a `PromiseLike` and subscribes once: a Postgrest builder sends a new
 * request on every `.then()`, so `after()` and the caller must share one
 * promise. `after()` only waits for it to settle; a rejection stays the
 * caller's to handle and log. Outside a request scope (build, tests) `after()`
 * throws; the work then simply runs untracked, as it did before.
 */
export function keepInvocationAlive<T>(work: PromiseLike<T>): Promise<T> {
  const promise = Promise.resolve(work);
  try {
    after(promise.then(noop, noop));
  } catch {
    // No request scope or no waitUntil: nothing to keep alive.
  }
  return promise;
}

function noop(): void {}
