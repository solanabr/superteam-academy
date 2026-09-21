import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

// Same passthrough as `content/deployments.test.ts`: `unstable_cache` needs a
// request-scoped incremental cache that only exists inside a real Next request.
vi.mock("next/cache", () => ({
  unstable_cache:
    <Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) =>
    (...args: Args) =>
      fn(...args),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/content/queries", () => ({ COURSES_CACHE_TAG: "courses" }));

const { getLessonVideoEmbeds } = await import("../embeddability");

const videoBlock = { key: "video", _type: "video" as const };
const yt = (url: string) => [{ ...videoBlock, url }];
const RESTRICTED = "https://www.youtube.com/watch?v=40KvouUtgbc";
const PLAYABLE = "https://www.youtube.com/watch?v=L65KvCbTqRo";

function fetchMock(
  impl: (url: string) => Promise<Response> | Response
): typeof fetch {
  return vi.fn((input: RequestInfo | URL) =>
    Promise.resolve(impl(String(input)))
  ) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getLessonVideoEmbeds", () => {
  it("200 + a title → embeddable, so the iframe renders", async () => {
    vi.stubGlobal(
      "fetch",
      fetchMock(
        () =>
          new Response(JSON.stringify({ title: "Solana: Origens" }), {
            status: 200,
          })
      )
    );
    expect(await getLessonVideoEmbeds(yt(PLAYABLE))).toEqual({
      video: { embeddable: true, title: "Solana: Origens" },
    });
  });

  it("401 → not embeddable, so the watch-on-YouTube card renders", async () => {
    vi.stubGlobal(
      "fetch",
      fetchMock(() => new Response("Unauthorized", { status: 401 }))
    );
    expect(await getLessonVideoEmbeds(yt(RESTRICTED))).toEqual({
      video: { embeddable: false, title: null },
    });
  });

  it("403/404 are equally definitive", async () => {
    for (const status of [403, 404]) {
      vi.stubGlobal(
        "fetch",
        fetchMock(() => new Response("", { status }))
      );
      const out = await getLessonVideoEmbeds([
        { key: `v-${status}`, _type: "video", url: RESTRICTED },
      ]);
      expect(out[`v-${status}`]!.embeddable).toBe(false);
    }
  });

  it("a network error assumes embeddable — YouTube never blocks the page", async () => {
    vi.stubGlobal(
      "fetch",
      fetchMock(() => {
        throw new Error("ETIMEDOUT");
      })
    );
    expect(await getLessonVideoEmbeds(yt(PLAYABLE))).toEqual({
      video: { embeddable: true, title: null },
    });
  });

  it("a 5xx assumes embeddable too (not a refusal, just a bad day)", async () => {
    vi.stubGlobal(
      "fetch",
      fetchMock(() => new Response("", { status: 503 }))
    );
    expect(await getLessonVideoEmbeds(yt(PLAYABLE))).toEqual({
      video: { embeddable: true, title: null },
    });
  });

  it("probes nothing for a lesson with no YouTube video", async () => {
    const probe = vi.fn();
    vi.stubGlobal("fetch", probe);
    expect(
      await getLessonVideoEmbeds([
        { key: "p", _type: "prose" },
        { key: "v", _type: "video", url: "https://vimeo.com/123" },
        { key: "bad", _type: "video", url: "nonsense" },
      ])
    ).toEqual({});
    expect(probe).not.toHaveBeenCalled();
  });

  it("probes each id once, even when two blocks share it", async () => {
    const probe = vi.fn(async () => ({ embeddable: false, title: null }));
    const out = await getLessonVideoEmbeds(
      [
        { key: "a", _type: "video", url: RESTRICTED },
        { key: "b", _type: "video", url: RESTRICTED },
      ],
      { probe }
    );
    expect(Object.keys(out)).toEqual(["a", "b"]);
    expect(probe).toHaveBeenCalledTimes(1);
  });
});
