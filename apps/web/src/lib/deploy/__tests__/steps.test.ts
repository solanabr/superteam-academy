import { describe, it, expect, beforeEach } from "vitest";
import {
  deriveDeploySteps,
  EMPTY_DEPLOY_FLOW,
  type DeployFlowState,
} from "../steps";
import {
  getDeployFlow,
  resetDeployFlow,
  setDeployFlow,
  subscribeDeployFlow,
} from "../flow-store";
import { deployProgress, formatElapsed } from "../progress";

function statuses(state: Partial<DeployFlowState>) {
  return deriveDeploySteps({ ...EMPTY_DEPLOY_FLOW, ...state }).map(
    (s) => `${s.key}:${s.status}`
  );
}

describe("deriveDeploySteps", () => {
  it("starts with build active and everything after it pending", () => {
    expect(statuses({})).toEqual([
      "build:active",
      "fund:todo",
      "deploy:todo",
      "submit:todo",
    ]);
  });

  it("ticks the build and moves to funding", () => {
    expect(statuses({ built: true })).toEqual([
      "build:done",
      "fund:active",
      "deploy:todo",
      "submit:todo",
    ]);
  });

  it("points at deploy once the wallet holds the estimate", () => {
    expect(statuses({ built: true, funded: true })).toEqual([
      "build:done",
      "fund:done",
      "deploy:active",
      "submit:todo",
    ]);
  });

  it("points at submit once the program is live", () => {
    expect(statuses({ built: true, funded: true, deployed: true })).toEqual([
      "build:done",
      "fund:done",
      "deploy:done",
      "submit:active",
    ]);
  });

  it("leaves nothing active once the lesson is submitted", () => {
    const all = deriveDeploySteps({
      built: true,
      funded: true,
      deployed: true,
      submitted: true,
    });
    expect(all.every((s) => s.status === "done")).toBe(true);
  });

  it("only ever marks one step active, even out of order", () => {
    const derived = deriveDeploySteps({
      built: false,
      funded: true,
      deployed: true,
      submitted: false,
    });
    expect(derived.filter((s) => s.status === "active")).toHaveLength(1);
    expect(derived[0]).toEqual({ key: "build", status: "active" });
  });
});

describe("deploy flow store", () => {
  beforeEach(() => resetDeployFlow());

  it("notifies subscribers on a real change", () => {
    let hits = 0;
    const unsubscribe = subscribeDeployFlow(() => hits++);
    setDeployFlow({ built: true });
    expect(hits).toBe(1);
    expect(getDeployFlow().built).toBe(true);
    unsubscribe();
  });

  it("stays quiet when the patch changes nothing", () => {
    setDeployFlow({ built: true });
    let hits = 0;
    const unsubscribe = subscribeDeployFlow(() => hits++);
    setDeployFlow({ built: true });
    expect(hits).toBe(0);
    unsubscribe();
  });

  it("returns a stable snapshot object between changes", () => {
    const first = getDeployFlow();
    setDeployFlow({ built: false });
    expect(getDeployFlow()).toBe(first);
  });
});

describe("deployProgress", () => {
  it("is empty before the chunk total is known", () => {
    expect(
      deployProgress({ chunkCurrent: 0, chunkTotal: 0, elapsedMs: 0 })
    ).toEqual({ percent: 0, remainingSeconds: null });
  });

  it("computes percent and extrapolates the remaining time", () => {
    // 10 of 74 chunks in 20s -> 2s/chunk, 64 left.
    expect(
      deployProgress({ chunkCurrent: 10, chunkTotal: 74, elapsedMs: 20_000 })
    ).toEqual({ percent: 14, remainingSeconds: 128 });
  });

  it("has no estimate before the first chunk lands", () => {
    expect(
      deployProgress({ chunkCurrent: 0, chunkTotal: 74, elapsedMs: 5_000 })
    ).toEqual({ percent: 0, remainingSeconds: null });
  });

  it("clamps at the total and drops the estimate when done", () => {
    expect(
      deployProgress({ chunkCurrent: 80, chunkTotal: 74, elapsedMs: 60_000 })
    ).toEqual({ percent: 100, remainingSeconds: null });
  });
});

describe("formatElapsed", () => {
  it("reads in seconds under a minute and in minutes past it", () => {
    expect(formatElapsed(4_400)).toBe("4s");
    expect(formatElapsed(95_000)).toBe("1m 35s");
  });
});
