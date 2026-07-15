import { describe, it, expect } from "vitest";
import {
  isManagedPath,
  bumpLockContent,
  bundleFreshFiles,
  retainedBaseEntries,
  LOCK_REPO_PATH,
  GENERATED_REPO_DIR,
  ASSET_REPO_DIR,
  type BaseTreeEntry,
} from "../publish-tree";
import type { CompiledBundle } from "@/lib/content/compile/compile-bundle";

const dec = new TextDecoder();

describe("isManagedPath", () => {
  it("owns the lock, generated dir, and asset dir; nothing else", () => {
    expect(isManagedPath(LOCK_REPO_PATH)).toBe(true);
    expect(isManagedPath(`${GENERATED_REPO_DIR}/meta.json`)).toBe(true);
    expect(isManagedPath(`${GENERATED_REPO_DIR}/README.md`)).toBe(true);
    expect(isManagedPath(`${ASSET_REPO_DIR}/intro/x.png`)).toBe(true);

    expect(isManagedPath("apps/web/src/app/page.tsx")).toBe(false);
    expect(isManagedPath("apps/web/package.json")).toBe(false);
    // A sibling path that merely shares a prefix substring must NOT be managed.
    expect(isManagedPath("apps/web/content.lock.bak")).toBe(false);
    expect(isManagedPath(`${GENERATED_REPO_DIR}-other/x`)).toBe(false);
  });
});

describe("bumpLockContent", () => {
  it("swaps only the sha, preserving every other byte", () => {
    const oldSha = "089740d5da52d4180c40d03c44262fd05eed54f1";
    const newSha = "a".repeat(40);
    const raw = `{\n  "repo": "solanabr/courses-academy",\n  "sha": "${oldSha}"\n}\n`;
    const { text, oldSha: reported } = bumpLockContent(raw, newSha);
    expect(reported).toBe(oldSha);
    expect(text).toBe(
      `{\n  "repo": "solanabr/courses-academy",\n  "sha": "${newSha}"\n}\n`
    );
    expect(text).not.toContain(oldSha);
  });

  it("throws when the lock has no sha", () => {
    expect(() => bumpLockContent(`{"repo":"x"}`, "b".repeat(40))).toThrow();
  });
});

function fakeBundle(): CompiledBundle {
  return {
    files: new Map([
      ["meta.json", '{\n  "sha": "z"\n}\n'],
      ["courses.json", "[]\n"],
    ]),
    assets: new Map([["intro/hello/pic.png", new Uint8Array([1, 2, 3])]]),
  };
}

describe("bundleFreshFiles", () => {
  it("lays out lock + README + JSON modules + assets at repo-relative paths", () => {
    const lockText = `{\n  "sha": "new"\n}\n`;
    const files = bundleFreshFiles(fakeBundle(), lockText);
    const byPath = new Map(files.map((f) => [f.path, f.bytes]));

    expect(dec.decode(byPath.get(LOCK_REPO_PATH))).toBe(lockText);
    expect(dec.decode(byPath.get(`${GENERATED_REPO_DIR}/README.md`))).toContain(
      "Generated content bundle"
    );
    expect(dec.decode(byPath.get(`${GENERATED_REPO_DIR}/meta.json`))).toBe(
      '{\n  "sha": "z"\n}\n'
    );
    expect(dec.decode(byPath.get(`${GENERATED_REPO_DIR}/courses.json`))).toBe(
      "[]\n"
    );
    expect(
      Array.from(byPath.get(`${ASSET_REPO_DIR}/intro/hello/pic.png`)!)
    ).toEqual([1, 2, 3]);
  });
});

describe("retainedBaseEntries", () => {
  it("drops managed leaves and implicit tree entries, keeps everything else", () => {
    const entries: BaseTreeEntry[] = [
      { path: "apps/web/src/app", mode: "040000", type: "tree", sha: "t1" },
      {
        path: "apps/web/package.json",
        mode: "100644",
        type: "blob",
        sha: "b1",
      },
      { path: LOCK_REPO_PATH, mode: "100644", type: "blob", sha: "b2" },
      {
        path: `${GENERATED_REPO_DIR}/meta.json`,
        mode: "100644",
        type: "blob",
        sha: "b3",
      },
      {
        path: `${ASSET_REPO_DIR}/x.png`,
        mode: "100644",
        type: "blob",
        sha: "b4",
      },
      { path: "onchain/submodule", mode: "160000", type: "commit", sha: "c1" },
    ];
    const kept = retainedBaseEntries(entries).map((e) => e.path);
    expect(kept).toEqual(["apps/web/package.json", "onchain/submodule"]);
  });
});
