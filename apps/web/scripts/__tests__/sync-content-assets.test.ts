/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { createHash } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const blob = vi.hoisted(() => {
  class BlobError extends Error {}
  return { list: vi.fn(), put: vi.fn(), BlobError };
});
vi.mock("@vercel/blob", () => blob);

import { CONTENT_BLOB_BASE_URL } from "../../src/lib/content/blob-store.mjs";
import {
  contentImagePathname,
  contentImageUrl,
  type AssetManifestEntry,
} from "../../src/lib/content/compile/assets";
import { syncContentAssets } from "../sync-content-assets";

const LOCK = { repo: "solanabr/academy-courses", sha: "a".repeat(40) };
const VERCEL_ENV = { VERCEL: "1", BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_x_y" };

const enc = (s: string): Uint8Array => new TextEncoder().encode(s);
const sha256 = (b: Uint8Array): string =>
  createHash("sha256").update(b).digest("hex");

function entry(path: string, bytes: Uint8Array): AssetManifestEntry {
  return {
    sha256: sha256(bytes),
    ext: "webp",
    size: bytes.length,
    contentType: "image/webp",
    path,
  };
}

const A = enc("bytes of a");
const B = enc("bytes of b");
const ENTRY_A = entry("courses/c/assets/a.webp", A);
const ENTRY_B = entry("courses/c/lessons/l/assets/b.webp", B);
const keyOf = (e: AssetManifestEntry): string =>
  contentImagePathname(e.sha256, e.ext);
const urlOf = (e: AssetManifestEntry): string =>
  contentImageUrl(e.sha256, e.ext);

const fetchMock = vi.fn();
const log = vi.fn();

/** GitHub serves each manifest path's bytes. */
function githubServes(files: Record<string, Uint8Array>): void {
  fetchMock.mockImplementation((url: string) => {
    const path = Object.keys(files).find((p) => url.endsWith(`/${p}`));
    return Promise.resolve(
      path
        ? new Response(new Uint8Array(files[path]!), { status: 200 })
        : new Response("404: Not Found", { status: 404 })
    );
  });
}

/** The store already holds `present`, split across two list() pages. */
function storeHolds(...present: AssetManifestEntry[]): void {
  const blobs = present.map((e) => ({ pathname: keyOf(e), url: urlOf(e) }));
  blob.list
    .mockResolvedValueOnce({
      blobs: blobs.slice(0, 1),
      hasMore: true,
      cursor: "page-2",
    })
    .mockResolvedValueOnce({ blobs: blobs.slice(1), hasMore: false });
}

beforeEach(() => {
  blob.list.mockReset();
  blob.put.mockReset();
  blob.put.mockImplementation((pathname: string) =>
    Promise.resolve({ url: `${CONTENT_BLOB_BASE_URL}/${pathname}` })
  );
  fetchMock.mockReset();
  log.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("syncContentAssets", () => {
  it("skips outside a Vercel build and touches nothing", async () => {
    const result = await syncContentAssets({
      manifest: [ENTRY_A],
      lock: LOCK,
      env: { BLOB_READ_WRITE_TOKEN: "set-but-irrelevant" },
      log,
    });

    expect(result.skipped).toBe(true);
    expect(blob.list).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(log.mock.calls[0]![0]).toMatch(/skipping/);
  });

  it("fails a Vercel build that has no Blob token", async () => {
    await expect(
      syncContentAssets({
        manifest: [ENTRY_A],
        lock: LOCK,
        env: { VERCEL: "1" },
        log,
      })
    ).rejects.toThrow(/BLOB_READ_WRITE_TOKEN/);
    expect(blob.list).not.toHaveBeenCalled();
  });

  it("lists every page and uploads only what the store is missing", async () => {
    const C = enc("bytes of c");
    const ENTRY_C = entry("courses/c/assets/c.webp", C);
    storeHolds(ENTRY_A, ENTRY_C);
    githubServes({ [ENTRY_B.path]: B });

    const result = await syncContentAssets({
      // A manifest content type is ignored: the extension decides.
      manifest: [ENTRY_A, { ...ENTRY_B, contentType: "text/html" }, ENTRY_C],
      lock: LOCK,
      env: { ...VERCEL_ENV, GITHUB_TOKEN: "ghs_test" },
      log,
    });

    expect(result).toEqual({ skipped: false, present: 2, uploaded: 1 });
    expect(blob.list).toHaveBeenCalledTimes(2);
    expect(blob.list.mock.calls[1]![0]).toMatchObject({
      prefix: "content/",
      cursor: "page-2",
    });

    // Public raw host, no token: preview builds have none, and the REST API
    // quota never applies.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]).toEqual([
      `https://raw.githubusercontent.com/${LOCK.repo}/${LOCK.sha}/${ENTRY_B.path}`,
    ]);

    expect(blob.put).toHaveBeenCalledTimes(1);
    const [pathname, body, options] = blob.put.mock.calls[0]!;
    expect(pathname).toBe(keyOf(ENTRY_B));
    expect(new Uint8Array(body as Buffer)).toEqual(B);
    expect(options).toEqual({
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 31536000,
      contentType: "image/webp",
      token: VERCEL_ENV.BLOB_READ_WRITE_TOKEN,
    });
  });

  it("fails when the bytes on GitHub do not hash to the manifest", async () => {
    storeHolds();
    githubServes({ [ENTRY_A.path]: enc("tampered") });

    await expect(
      syncContentAssets({
        manifest: [ENTRY_A],
        lock: LOCK,
        env: VERCEL_ENV,
        log,
      })
    ).rejects.toThrow(/hashes to/);
    expect(blob.put).not.toHaveBeenCalled();
  });

  it("fails when GitHub does not have the file at the locked SHA", async () => {
    storeHolds();
    githubServes({});

    await expect(
      syncContentAssets({
        manifest: [ENTRY_A],
        lock: LOCK,
        env: VERCEL_ENV,
        log,
      })
    ).rejects.toThrow(/GitHub returned 404/);
    expect(blob.put).not.toHaveBeenCalled();
  });

  it("fails when put() returns a url other than the one the bundle carries", async () => {
    storeHolds();
    githubServes({ [ENTRY_A.path]: A });
    blob.put.mockResolvedValue({
      url: `https://someotherstore.public.blob.vercel-storage.com/${keyOf(ENTRY_A)}`,
    });

    await expect(
      syncContentAssets({
        manifest: [ENTRY_A],
        lock: LOCK,
        env: VERCEL_ENV,
        log,
      })
    ).rejects.toThrow(/CONTENT_BLOB_BASE_URL is wrong/);
  });

  it("fails when an already-uploaded blob lives at a different url", async () => {
    blob.list.mockResolvedValueOnce({
      blobs: [
        {
          pathname: keyOf(ENTRY_A),
          url: `https://someotherstore.public.blob.vercel-storage.com/${keyOf(ENTRY_A)}`,
        },
      ],
      hasMore: false,
    });

    await expect(
      syncContentAssets({
        manifest: [ENTRY_A],
        lock: LOCK,
        env: VERCEL_ENV,
        log,
      })
    ).rejects.toThrow(/CONTENT_BLOB_BASE_URL is wrong/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a key another build uploaded meanwhile as done", async () => {
    storeHolds();
    githubServes({ [ENTRY_A.path]: A });
    blob.put.mockRejectedValue(
      new blob.BlobError("Vercel Blob: This blob already exists")
    );

    const result = await syncContentAssets({
      manifest: [ENTRY_A],
      lock: LOCK,
      env: VERCEL_ENV,
      log,
    });

    expect(result.uploaded).toBe(1);
  });

  it.each([
    ["a short hash", { ...ENTRY_A, sha256: "abc" }],
    ["an ext outside the allowlist", { ...ENTRY_A, ext: "html" }],
    ["a traversal", { ...ENTRY_A, path: "courses/../../x/a.webp" }],
    ["a leading slash", { ...ENTRY_A, path: "/courses/c/a.webp" }],
    ["a backslash", { ...ENTRY_A, path: "courses\\c\\a.webp" }],
    ["a path whose ext disagrees", { ...ENTRY_A, path: "courses/c/a.svg" }],
    ["an oversize entry", { ...ENTRY_A, size: 2 * 1024 * 1024 }],
  ])("refuses a manifest with %s before touching anything", async (_, bad) => {
    await expect(
      syncContentAssets({
        manifest: [ENTRY_B, bad],
        lock: LOCK,
        env: VERCEL_ENV,
        log,
      })
    ).rejects.toThrow(/assets.json has 1 malformed/);
    expect(blob.list).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a malformed content.lock", async () => {
    await expect(
      syncContentAssets({
        manifest: [ENTRY_A],
        lock: { repo: "evil.example/../x", sha: LOCK.sha },
        env: VERCEL_ENV,
        log,
      })
    ).rejects.toThrow(/content.lock is malformed/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe("GitHub rate limits", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      ["a 429", new Response("slow down", { status: 429 })],
      [
        "a rate-limited 403",
        new Response("rate limited", {
          status: 403,
          headers: { "retry-after": "2" },
        }),
      ],
    ])("waits out %s and retries", async (_, limited) => {
      storeHolds();
      fetchMock
        .mockResolvedValueOnce(limited)
        .mockResolvedValueOnce(new Response(new Uint8Array(A)));

      const run = syncContentAssets({
        manifest: [ENTRY_A],
        lock: LOCK,
        env: VERCEL_ENV,
        log,
      });
      await vi.runAllTimersAsync();

      await expect(run).resolves.toMatchObject({ uploaded: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("gives up after a bounded number of tries", async () => {
      storeHolds();
      fetchMock.mockImplementation(() =>
        Promise.resolve(new Response("slow down", { status: 429 }))
      );

      const run = syncContentAssets({
        manifest: [ENTRY_A],
        lock: LOCK,
        env: VERCEL_ENV,
        log,
      });
      const failed = expect(run).rejects.toThrow(/GitHub returned 429/);
      await vi.runAllTimersAsync();

      await failed;
      expect(fetchMock).toHaveBeenCalledTimes(5);
      expect(blob.put).not.toHaveBeenCalled();
    });

    it("does not retry a plain 403", async () => {
      storeHolds();
      fetchMock.mockResolvedValue(new Response("nope", { status: 403 }));

      await expect(
        syncContentAssets({
          manifest: [ENTRY_A],
          lock: LOCK,
          env: VERCEL_ENV,
          log,
        })
      ).rejects.toThrow(/GitHub returned 403/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
