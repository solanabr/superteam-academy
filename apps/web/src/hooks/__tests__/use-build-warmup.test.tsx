// @vitest-environment jsdom
import { StrictMode } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { LessonBlock } from "@superteam-lms/types";
import { BUILD_WARM_INTERVAL_MS, useBuildWarmup } from "../use-build-warmup";

const fetchMock = vi.fn<typeof fetch>();

const code = (buildType: "standard" | "buildable") =>
  ({ _type: "code", key: `code-${buildType}`, buildType }) as LessonBlock;
const prose = { _type: "prose", key: "p1" } as LessonBlock;

const BUILDABLE = [prose, code("buildable")];
const STANDARD_ONLY = [prose, code("standard")];

function Probe(props: { signedIn: boolean; blocks: LessonBlock[] }) {
  useBuildWarmup(props);
  return null;
}

/** One lesson page view, flushed past the after-render deferral. */
async function view(signedIn: boolean, blocks: LessonBlock[]) {
  const result = render(<Probe signedIn={signedIn} blocks={blocks} />);
  await vi.runAllTimersAsync();
  return result;
}

function warmCalls() {
  return fetchMock.mock.calls.filter(
    ([url]) => url === "/api/build-program/warm"
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response('{"status":"ready"}'));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useBuildWarmup", () => {
  it("posts once for a signed-in learner on a lesson with a buildable block", async () => {
    await view(true, BUILDABLE);

    expect(warmCalls()).toHaveLength(1);
    expect(warmCalls()[0]![1]).toMatchObject({ method: "POST" });
  });

  it("does not fire during render", () => {
    render(<Probe signedIn blocks={BUILDABLE} />);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing when signed out", async () => {
    await view(false, BUILDABLE);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing on a lesson without a buildable block", async () => {
    await view(true, STANDARD_ONLY);
    await view(true, [prose]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fires once sign-in resolves after the first render", async () => {
    const { rerender } = await view(false, BUILDABLE);
    expect(fetchMock).not.toHaveBeenCalled();

    rerender(<Probe signedIn blocks={BUILDABLE} />);
    await vi.runAllTimersAsync();

    expect(warmCalls()).toHaveLength(1);
  });

  it("fires once per view across re-renders and under StrictMode", async () => {
    const { rerender } = render(
      <StrictMode>
        <Probe signedIn blocks={BUILDABLE} />
      </StrictMode>
    );
    await vi.runAllTimersAsync();
    rerender(
      <StrictMode>
        <Probe signedIn blocks={[...BUILDABLE]} />
      </StrictMode>
    );
    await vi.runAllTimersAsync();

    expect(warmCalls()).toHaveLength(1);
  });

  it("a second view in the same tab within five minutes does not call again", async () => {
    (await view(true, BUILDABLE)).unmount();

    vi.advanceTimersByTime(BUILD_WARM_INTERVAL_MS - 1_000);
    (await view(true, BUILDABLE)).unmount();
    expect(warmCalls()).toHaveLength(1);

    vi.advanceTimersByTime(2_000);
    await view(true, BUILDABLE);
    expect(warmCalls()).toHaveLength(2);
  });

  it("still fires, once, when sessionStorage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });

    const { rerender } = await view(true, BUILDABLE);
    rerender(<Probe signedIn blocks={[...BUILDABLE]} />);
    await vi.runAllTimersAsync();

    expect(warmCalls()).toHaveLength(1);
  });

  it("ignores a failed call", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await view(true, BUILDABLE);
    await vi.runAllTimersAsync();
    process.off("unhandledRejection", unhandled);

    expect(warmCalls()).toHaveLength(1);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it("uses an idle callback when the browser has one", async () => {
    let idle: (() => void) | null = null;
    vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
      idle = cb;
      return 1;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());

    await view(true, BUILDABLE);
    expect(fetchMock).not.toHaveBeenCalled();

    (idle as (() => void) | null)?.();
    expect(warmCalls()).toHaveLength(1);
  });
});
