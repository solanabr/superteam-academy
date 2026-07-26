import { describe, it, expect, vi } from "vitest";
import {
  classifySaveResponse,
  saveDeploymentWithRetry,
  type SaveStatus,
} from "../save-deployment";

const PARAMS = {
  lessonId: "lesson-1",
  courseId: "course-solana-101",
  programId: "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF",
};

// No real backoff in tests — the schedule length still governs how many
// retries happen, but each "delay" resolves immediately.
const NO_DELAY = { delaysMs: [0, 0, 0], sleep: () => Promise.resolve() };

function fetchReturning(...statuses: (number | "network-error")[]) {
  const queue = [...statuses];
  const last = statuses[statuses.length - 1] ?? 200;
  return vi.fn(async () => {
    const next = queue.shift() ?? last;
    if (next === "network-error") throw new Error("offline");
    return { status: next, ok: next >= 200 && next < 300 } as Response;
  });
}

describe("classifySaveResponse", () => {
  it("maps 2xx to saved", () => {
    expect(classifySaveResponse(200)).toBe("saved");
    expect(classifySaveResponse(201)).toBe("saved");
  });

  it("maps 429 and 5xx and network errors to retryable", () => {
    expect(classifySaveResponse(429)).toBe("retryable");
    expect(classifySaveResponse(500)).toBe("retryable");
    expect(classifySaveResponse(503)).toBe("retryable");
    expect(classifySaveResponse(null)).toBe("retryable");
  });

  it("maps other 4xx (verification / wallet mismatch) to rejected", () => {
    expect(classifySaveResponse(400)).toBe("rejected");
    expect(classifySaveResponse(401)).toBe("rejected");
  });
});

describe("saveDeploymentWithRetry", () => {
  it("returns saved on a first-try 200 and reports saving → saved", async () => {
    const fetchImpl = fetchReturning(200);
    const statuses: SaveStatus[] = [];
    const outcome = await saveDeploymentWithRetry(PARAMS, {
      ...NO_DELAY,
      fetchImpl,
      onStatus: (s) => statuses.push(s),
    });
    expect(outcome).toBe("saved");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual(["saving", "saved"]);
  });

  it("retries transient failures then succeeds", async () => {
    const fetchImpl = fetchReturning(503, "network-error", 200);
    const statuses: SaveStatus[] = [];
    const outcome = await saveDeploymentWithRetry(PARAMS, {
      ...NO_DELAY,
      fetchImpl,
      onStatus: (s) => statuses.push(s),
    });
    expect(outcome).toBe("saved");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(statuses).toEqual(["saving", "retrying", "retrying", "saved"]);
  });

  it("gives up as retryable after the backoff schedule is exhausted", async () => {
    const fetchImpl = fetchReturning(503);
    const outcome = await saveDeploymentWithRetry(PARAMS, {
      ...NO_DELAY,
      fetchImpl,
    });
    expect(outcome).toBe("retryable");
    // initial attempt + 3 scheduled retries
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("does NOT retry a 400 rejection — one attempt, terminal", async () => {
    const fetchImpl = fetchReturning(400);
    const statuses: SaveStatus[] = [];
    const outcome = await saveDeploymentWithRetry(PARAMS, {
      ...NO_DELAY,
      fetchImpl,
      onStatus: (s) => statuses.push(s),
    });
    expect(outcome).toBe("rejected");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual(["saving", "rejected"]);
  });

  it("aborts before the first attempt when cancelled", async () => {
    const fetchImpl = fetchReturning(200);
    const outcome = await saveDeploymentWithRetry(PARAMS, {
      ...NO_DELAY,
      fetchImpl,
      isCancelled: () => true,
    });
    expect(outcome).toBe("retryable");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("POSTs exactly the three fields the route validates", async () => {
    const fetchImpl = fetchReturning(200);
    await saveDeploymentWithRetry(PARAMS, { ...NO_DELAY, fetchImpl });
    const [, init] = (fetchImpl.mock.calls[0] ?? []) as unknown as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(init.body as string)).toEqual({
      lessonId: PARAMS.lessonId,
      courseId: PARAMS.courseId,
      programId: PARAMS.programId,
    });
  });
});
