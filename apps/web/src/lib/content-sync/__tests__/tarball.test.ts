import { gzipSync } from "node:zlib";
import { describe, it, expect } from "vitest";
import { extractTarball } from "../tarball";
import { makeTar } from "./_fixtures";

describe("extractTarball", () => {
  it("strips the generated top dir and keys by repo-relative path", async () => {
    const tar = makeTar({
      "solanabr-academy-courses-abc123/courses/solana-fundamentals/course.yaml":
        "id: course-solana-fundamentals\n",
      "solanabr-academy-courses-abc123/courses/solana-fundamentals/lessons/accounts/intro.md":
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
});
