import { describe, it, expect, vi, beforeEach } from "vitest";
import { keepInvocationAlive } from "../keep-alive";

vi.mock("server-only", () => ({}));

const after = vi.hoisted(() => vi.fn());
vi.mock("next/server", () => ({ after }));

beforeEach(() => {
  after.mockReset();
});

describe("keepInvocationAlive", () => {
  it("hands after() a promise that settles with the work", async () => {
    let resolve!: (v: number) => void;
    const kept = keepInvocationAlive(new Promise<number>((r) => (resolve = r)));
    expect(after).toHaveBeenCalledTimes(1);
    const tracked = after.mock.calls[0]?.[0] as Promise<void>;
    let settled = false;
    void tracked.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    resolve(42);
    await expect(kept).resolves.toBe(42);
    await tracked;
    expect(settled).toBe(true);
  });

  // after() reports a rejected task on its own; the loaders already log their
  // failures under a stable code, so the tracked promise must not reject.
  it("leaves a rejection to the caller, not after()", async () => {
    const kept = keepInvocationAlive(Promise.reject(new Error("boom")));
    await expect(after.mock.calls[0]?.[0]).resolves.toBeUndefined();
    await expect(kept).rejects.toThrow("boom");
  });

  // A Postgrest builder is a thenable that sends a NEW request on every
  // `.then()`. after() and the caller must share one promise, or the RPC
  // goes out twice.
  it("subscribes to a thenable exactly once", async () => {
    const sends = vi.fn();
    const builder: PromiseLike<string> = {
      then(onfulfilled, onrejected) {
        sends();
        return Promise.resolve("rows").then(onfulfilled, onrejected);
      },
    };
    const kept = keepInvocationAlive(builder);
    await kept;
    await kept;
    expect(sends).toHaveBeenCalledTimes(1);
  });

  it("still returns the work when after() throws outside a request scope", async () => {
    after.mockImplementation(() => {
      throw new Error("`after` was called outside a request scope");
    });
    await expect(keepInvocationAlive(Promise.resolve("ok"))).resolves.toBe(
      "ok"
    );
  });
});
