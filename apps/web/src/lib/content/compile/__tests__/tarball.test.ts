import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { gzipSync } from "node:zlib";
import { describe, it, expect } from "vitest";
import {
  extractTarball,
  splitRepoTree,
  TarballTooLargeError,
} from "../tarball";
import { makeTar, PNG_1X1 } from "./_fixtures";

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

describe("extractTarball", () => {
  it("strips the generated top dir and keys by repo-relative path", async () => {
    const tar = makeTar({
      "solanabr-academy-courses-abc123/courses/solana-fundamentals/course.yaml":
        "id: course-solana-fundamentals\n",
      "solanabr-academy-courses-abc123/courses/solana-fundamentals/lessons/accounts/intro.md":
        "# Accounts\n",
    });
    const { files: tree } = await extractTarball(gzipSync(Buffer.from(tar)));
    expect([...tree.keys()].sort()).toEqual([
      "courses/solana-fundamentals/course.yaml",
      "courses/solana-fundamentals/lessons/accounts/intro.md",
    ]);
    expect(
      new TextDecoder().decode(
        tree.get("courses/solana-fundamentals/course.yaml")
      )
    ).toContain("course-solana-fundamentals");
  });

  it("excludes courses/_template/", async () => {
    const tar = makeTar({
      "r-abc/courses/_template/course.yaml": "id: course-template\n",
      "r-abc/courses/real/course.yaml": "id: course-real\n",
    });
    const { files: tree } = await extractTarball(gzipSync(Buffer.from(tar)));
    expect([...tree.keys()]).toEqual(["courses/real/course.yaml"]);
  });

  it("excludes every _draft/ directory, in any collection (#973)", async () => {
    const tar = makeTar({
      "r-abc/courses/_draft/parked/course.yaml": "id: course-parked\n",
      "r-abc/courses/_draft/parked/lessons/x/lesson.yaml":
        "id: lesson-parked\n",
      "r-abc/paths/_draft/parked.yaml": "id: path-parked\n",
      "r-abc/achievements/_draft/parked.yaml": "id: achievement-parked\n",
      "r-abc/quests/_draft/parked.yaml": "id: quest-parked\n",
      "r-abc/courses/real/course.yaml": "id: course-real\n",
      // a directory NAMED like the convention but not it — stays visible, so
      // content-lint's unclassified-file diagnostic can flag the typo.
      "r-abc/courses/_drafts/typo/course.yaml": "id: course-typo\n",
    });
    const { files: tree } = await extractTarball(gzipSync(Buffer.from(tar)));
    expect([...tree.keys()].sort()).toEqual([
      "courses/_drafts/typo/course.yaml",
      "courses/real/course.yaml",
    ]);
  });

  it("reconstructs a path longer than 100 bytes from the ustar prefix field", async () => {
    // The generated `owner-repo-<40-char-sha>/` top dir alone is 65 bytes, so any
    // real repo path overflows the 100-byte name field; git archive splits it
    // across name + prefix. A naive reader that ignores prefix would drop this.
    const top = `solanabr-academy-courses-${"a".repeat(40)}`;
    const deep = `${top}/courses/solana-fundamentals/lessons/pdas-and-accounts/exercise/solution.ts`;
    expect(deep.length).toBeGreaterThan(100);
    const tar = makeTar({ [deep]: "// solution\n" });
    const { files: tree } = await extractTarball(gzipSync(Buffer.from(tar)));
    expect([...tree.keys()]).toEqual([
      "courses/solana-fundamentals/lessons/pdas-and-accounts/exercise/solution.ts",
    ]);
  });

  it("rejects a tarball that inflates past the streamed-bytes cap", async () => {
    // Guards against a gzip bomb: 4 KiB inflated, capped at 512 bytes. Image
    // bytes count here even though they are never kept.
    const tar = makeTar({ "r-abc/courses/real/big.png": "x".repeat(4096) });
    const gz = gzipSync(Buffer.from(tar));
    await expect(
      extractTarball(gz, { maxStreamedBytes: 512 })
    ).rejects.toBeInstanceOf(TarballTooLargeError);
  });

  it("caps the non-image bytes it keeps, and does not count images against it", async () => {
    const big = makeTar({ "r-abc/courses/real/big.md": "x".repeat(4096) });
    await expect(
      extractTarball(gzipSync(Buffer.from(big)), { maxRetainedBytes: 1024 })
    ).rejects.toBeInstanceOf(TarballTooLargeError);

    const image = makeTar({ "r-abc/courses/real/big.webp": "x".repeat(4096) });
    const tree = await extractTarball(gzipSync(Buffer.from(image)), {
      maxRetainedBytes: 1024,
    });
    expect(tree.images.get("courses/real/big.webp")?.size).toBe(4096);
  });

  it("rejects a tarball with more entries than the cap", async () => {
    // Guards against a pathological archive of many tiny headers.
    const tar = makeTar({
      "r-abc/courses/real/a.md": "a",
      "r-abc/courses/real/b.md": "b",
      "r-abc/courses/real/c.md": "c",
    });
    const gz = gzipSync(Buffer.from(tar));
    await expect(extractTarball(gz, { maxEntries: 2 })).rejects.toBeInstanceOf(
      TarballTooLargeError
    );
  });

  it("extracts normally within default caps", async () => {
    const tar = makeTar({
      "r-abc/courses/real/course.yaml": "id: course-real\n",
    });
    const { files: tree } = await extractTarball(gzipSync(Buffer.from(tar)));
    expect([...tree.keys()]).toEqual(["courses/real/course.yaml"]);
  });

  it("keeps no image bytes: hashes them, or only measures them", async () => {
    const tar = makeTar({
      "r-abc/courses/real/course.yaml": "id: course-real\n",
      "r-abc/courses/real/assets/pixel.png": PNG_1X1,
      "r-abc/courses/_draft/x/assets/parked.png": PNG_1X1,
    });
    const gz = gzipSync(Buffer.from(tar));

    const hashed = await extractTarball(gz, { hashImages: true });
    expect([...hashed.files.keys()]).toEqual(["courses/real/course.yaml"]);
    expect([...hashed.images]).toEqual([
      [
        "courses/real/assets/pixel.png",
        { size: PNG_1X1.length, sha256: sha256(PNG_1X1) },
      ],
    ]);

    const measured = await extractTarball(gz);
    expect(measured.images.get("courses/real/assets/pixel.png")).toEqual({
      size: PNG_1X1.length,
      sha256: null,
    });
  });

  it("parses entries split across arbitrary stream chunks", async () => {
    // Odd sizes and enough data that gunzip's 16 KiB output chunks cut through
    // headers, bodies and padding at varied offsets.
    const entries: Record<string, Uint8Array> = {};
    for (let i = 0; i < 40; i++) {
      const body = new Uint8Array(997 * (i + 1)).map(
        (_, j) => (i * 31 + j) % 251
      );
      entries[`r-abc/courses/c/lessons/l${i}/${i % 2 ? "a.webp" : "a.md"}`] =
        body;
    }
    const gz = gzipSync(Buffer.from(makeTar(entries)));
    const chunks: Buffer[] = [];
    for (let at = 0; at < gz.length; at += 7)
      chunks.push(gz.subarray(at, at + 7));

    const tree = await extractTarball(Readable.from(chunks), {
      hashImages: true,
    });
    for (const [name, body] of Object.entries(entries)) {
      const rel = name.slice("r-abc/".length);
      if (rel.endsWith(".webp")) {
        expect(tree.images.get(rel)).toEqual({
          size: body.length,
          sha256: sha256(body),
        });
      } else {
        expect(tree.files.get(rel)).toEqual(body);
      }
    }
    expect(tree.files.size + tree.images.size).toBe(40);
  });

  it("refuses a header with a corrupt size field", async () => {
    const tar = makeTar({ "r-abc/courses/real/a.md": "a" });
    tar.set(new TextEncoder().encode("zzzzzzzzzzz"), 124); // size field
    await expect(extractTarball(gzipSync(Buffer.from(tar)))).rejects.toThrow(
      /corrupt header/
    );
  });
});

describe("splitRepoTree", () => {
  it("hashes images out of an in-memory tree and keeps everything else", () => {
    const md = new TextEncoder().encode("# hi\n");
    const { files, images } = splitRepoTree(
      new Map([
        ["courses/c/intro.md", md],
        ["courses/c/assets/pixel.PNG", PNG_1X1],
      ])
    );
    expect([...files]).toEqual([["courses/c/intro.md", md]]);
    expect(images.get("courses/c/assets/pixel.PNG")).toEqual({
      size: PNG_1X1.length,
      sha256: sha256(PNG_1X1),
    });
  });
});
