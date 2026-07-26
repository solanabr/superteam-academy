import { describe, it, expect, vi, afterEach } from "vitest";
import { extractCourseVersion, fetchCourseVersion } from "../metadata";

function metadataWithAttributes(attributes: unknown): unknown {
  return { name: "Solana 101", attributes };
}

describe("extractCourseVersion — #497 Course Version stamp", () => {
  it("extracts the stamped numeric version", () => {
    const metadata = metadataWithAttributes([
      { trait_type: "Course", value: "Solana 101" },
      { trait_type: "Course Version", value: 3 },
    ]);
    expect(extractCourseVersion(metadata)).toBe(3);
  });

  it("tolerates a stringified number in externally pinned JSON", () => {
    const metadata = metadataWithAttributes([
      { trait_type: "Course Version", value: "2" },
    ]);
    expect(extractCourseVersion(metadata)).toBe(2);
  });

  it("is absent-safe for pre-#497 credentials (no attribute)", () => {
    const metadata = metadataWithAttributes([
      { trait_type: "Course", value: "Solana 101" },
    ]);
    expect(extractCourseVersion(metadata)).toBeNull();
  });

  it("returns null for malformed shapes rather than throwing", () => {
    expect(extractCourseVersion(null)).toBeNull();
    expect(extractCourseVersion("not-json-object")).toBeNull();
    expect(extractCourseVersion({})).toBeNull();
    expect(extractCourseVersion(metadataWithAttributes("nope"))).toBeNull();
    expect(extractCourseVersion(metadataWithAttributes([null, 7]))).toBeNull();
    expect(
      extractCourseVersion(
        metadataWithAttributes([{ trait_type: "Course Version", value: "v3" }])
      )
    ).toBeNull();
    expect(
      extractCourseVersion(
        metadataWithAttributes([{ trait_type: "Course Version", value: NaN }])
      )
    ).toBeNull();
  });
});

describe("fetchCourseVersion — best-effort metadata read", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(response: Partial<Response>) {
    const mock = vi.fn(
      async (_input: string, _init?: RequestInit) => response as Response
    );
    vi.stubGlobal("fetch", mock);
    return mock;
  }

  it("resolves the version from the metadata URI", async () => {
    const mock = stubFetch({
      ok: true,
      json: async () =>
        metadataWithAttributes([{ trait_type: "Course Version", value: 1 }]),
    });
    await expect(
      fetchCourseVersion("https://gateway.irys.xyz/abc")
    ).resolves.toBe(1);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0]?.[0]).toBe("https://gateway.irys.xyz/abc");
  });

  it("returns null without fetching when the URI is empty", async () => {
    const mock = stubFetch({ ok: true, json: async () => ({}) });
    await expect(fetchCourseVersion("")).resolves.toBeNull();
    expect(mock).not.toHaveBeenCalled();
  });

  it("returns null on a non-ok response", async () => {
    stubFetch({ ok: false, json: async () => ({}) });
    await expect(fetchCourseVersion("https://x/404")).resolves.toBeNull();
  });

  it("returns null on network failure (e.g. CORS-blocked cross-origin)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      })
    );
    await expect(fetchCourseVersion("https://x/blocked")).resolves.toBeNull();
  });

  it("returns null on invalid JSON", async () => {
    stubFetch({
      ok: true,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });
    await expect(fetchCourseVersion("https://x/not-json")).resolves.toBeNull();
  });
});
