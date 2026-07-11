import { gzipSync } from "node:zlib";
import { describe, it, expect } from "vitest";
import { extractTarball, TarballTooLargeError } from "../tarball";
import { makeTar } from "./_fixtures";

describe("extractTarball", () => {
  it("strips the generated top dir and keys by repo-relative path", async () => {
    const tar = makeTar({
      "solanabr-courses-academy-abc123/courses/solana-fundamentals/course.yaml":
        "id: course-solana-fundamentals\n",
      "solanabr-courses-academy-abc123/courses/solana-fundamentals/lessons/accounts/intro.md":
        "# Accounts\n",
    });
    const tree = await extractTarball(gzipSync(Buffer.from(tar)));
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
    const tree = await extractTarball(gzipSync(Buffer.from(tar)));
    expect([...tree.keys()]).toEqual(["courses/real/course.yaml"]);
  });

  it("reconstructs a path longer than 100 bytes from the ustar prefix field", async () => {
    // The generated `owner-repo-<40-char-sha>/` top dir alone is 65 bytes, so any
    // real repo path overflows the 100-byte name field; git archive splits it
    // across name + prefix. A naive reader that ignores prefix would drop this.
    const top = `solanabr-courses-academy-${"a".repeat(40)}`;
    const deep = `${top}/courses/solana-fundamentals/lessons/pdas-and-accounts/exercise/solution.ts`;
    expect(deep.length).toBeGreaterThan(100);
    const tar = makeTar({ [deep]: "// solution\n" });
    const tree = await extractTarball(gzipSync(Buffer.from(tar)));
    expect([...tree.keys()]).toEqual([
      "courses/solana-fundamentals/lessons/pdas-and-accounts/exercise/solution.ts",
    ]);
  });

  it("rejects a tarball that inflates past the decompressed-size cap", async () => {
    // Guards against a gzip bomb: 4 KiB inflated, capped at 512 bytes.
    const tar = makeTar({ "r-abc/courses/real/big.md": "x".repeat(4096) });
    const gz = gzipSync(Buffer.from(tar));
    await expect(
      extractTarball(gz, { maxDecompressedBytes: 512 })
    ).rejects.toBeInstanceOf(TarballTooLargeError);
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
    const tree = await extractTarball(gzipSync(Buffer.from(tar)));
    expect([...tree.keys()]).toEqual(["courses/real/course.yaml"]);
  });
});
