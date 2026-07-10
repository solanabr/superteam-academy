import { createHash } from "node:crypto";
import { describe, it, expect, vi } from "vitest";
import { runContentSync } from "../sync";
import { InMemoryGateway } from "../gateway";
import { BlockedCommitError, BlastRadiusError, type SanityDoc } from "../types";
import type { GitHubClient } from "../github";
import type { GraderSet } from "../executor-gate";
import { makeCourseTarball, PNG_1X1 } from "./_fixtures";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const graders: GraderSet = {
  js: async () => ({ passed: true, failures: [] }),
  rust: async () => ({ passed: true, failures: [] }),
  buildable: async () => ({ passed: true, failures: [] }),
};

function github(
  sha: string,
  checks: "success" | "failure",
  tarball: Uint8Array
): GitHubClient {
  return {
    fetchTarball: async () => tarball,
    fetchHeadSha: async () => sha,
    fetchChecksState: async () => checks,
  };
}

const SHA = "a".repeat(40);

const deps = (
  over: Partial<Parameters<typeof runContentSync>[0]> = {}
): Parameters<typeof runContentSync>[0] => ({
  sha: SHA,
  github: github(SHA, "success", makeCourseTarball(SHA)),
  gateway: new InMemoryGateway([]),
  graders,
  projectId: "p",
  dataset: "production",
  ...over,
});

describe("runContentSync", () => {
  it("refuses to sync a commit whose CI is red (§11.1 blocked)", async () => {
    const d = deps({
      github: github(SHA, "failure", makeCourseTarball(SHA)),
    });
    await expect(runContentSync(d)).rejects.toBeInstanceOf(BlockedCommitError);
    expect((d.gateway as InMemoryGateway).written).toEqual([]); // nothing written
  });

  it("writes the projected docs on a first sync and the singleton last", async () => {
    const d = deps();
    const result = await runContentSync(d);
    const gw = d.gateway as InMemoryGateway;
    expect(result.written).toBeGreaterThan(0);
    expect(gw.singleton?.sha).toBe(d.sha);
    // singleton is not part of the managed write batch
    expect(gw.written.some((x) => x._id === "contentSync")).toBe(false);
  });

  it("is idempotent — a second run at the same sha writes and deletes nothing", async () => {
    const gw = new InMemoryGateway([]);
    await runContentSync(deps({ gateway: gw }));
    const writesAfterFirst = gw.written.length;
    const deletesAfterFirst = gw.deleted.length;
    await runContentSync(
      deps({
        gateway: gw,
        github: github(SHA, "success", makeCourseTarball(SHA)),
      })
    );
    expect(gw.written.length).toBe(writesAfterFirst); // zero additional writes
    expect(gw.deleted.length).toBe(deletesAfterFirst); // zero additional deletes
  });

  it("aborts before any delete when the prune set exceeds 20%", async () => {
    // Seed the gateway with many stale managed docs from an old sha; the new
    // tree has one course, so nearly all would prune.
    const stale: SanityDoc[] = Array.from({ length: 50 }, (_v, i) => ({
      _id: `lesson-old-${i}`,
      _type: "lesson",
      sync: { source: "academy-courses", rev: "oldsha" },
    }));
    const gw = new InMemoryGateway(stale);
    await expect(runContentSync(deps({ gateway: gw }))).rejects.toBeInstanceOf(
      BlastRadiusError
    );
    expect(gw.deleted).toEqual([]); // never deleted anything
  });

  it("prunes a small stale set and reports the count", async () => {
    // 9 current-ish + 1 stale → prune 1 of 10 managed (< 20%).
    const current: SanityDoc[] = Array.from({ length: 9 }, (_v, i) => ({
      _id: `lesson-keep-${i}`,
      _type: "lesson",
      sync: { source: "academy-courses", rev: SHA },
    }));
    const stale: SanityDoc = {
      _id: "lesson-gone",
      _type: "lesson",
      sync: { source: "academy-courses", rev: "oldsha" },
    };
    const gw = new InMemoryGateway([...current, stale]);
    const result = await runContentSync(deps({ gateway: gw }));
    expect(gw.deleted).toContain("lesson-gone");
    expect(result.pruned).toBe(1);
  });

  it("computes asset ids from real probed dimensions, so an existing Sanity asset is skipped (§9.6)", async () => {
    // Sanity's asset _id embeds the REAL dimensions it computes on upload
    // (image-<sha1>-<w>x<h>-<format>). Seed the gateway with the id Sanity would
    // hold for PNG_1X1; the sync must probe the same 1x1 dims to match it and
    // skip the upload. A placeholder probe (0x0) would never match.
    const sha1 = createHash("sha1").update(PNG_1X1).digest("hex");
    const gw = new InMemoryGateway([]);
    gw.assets.add(`image-${sha1}-1x1-png`);
    const result = await runContentSync(
      deps({
        gateway: gw,
        github: github(
          SHA,
          "success",
          makeCourseTarball(SHA, { withImage: true })
        ),
      })
    );
    expect(result.assetsUploaded).toBe(0); // dedupe hit — nothing re-uploaded
  });

  it("uploads a new asset once and reports it", async () => {
    const gw = new InMemoryGateway([]);
    const result = await runContentSync(
      deps({
        gateway: gw,
        github: github(
          SHA,
          "success",
          makeCourseTarball(SHA, { withImage: true })
        ),
      })
    );
    expect(result.assetsUploaded).toBe(1);
  });
});
