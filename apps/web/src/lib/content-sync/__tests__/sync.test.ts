import { createHash } from "node:crypto";
import { describe, it, expect, vi } from "vitest";
import { runContentSync } from "../sync";
import { InMemoryGateway, type SanityGateway } from "../gateway";
import { BlockedCommitError, BlastRadiusError, type SanityDoc } from "../types";
import type { GitHubClient } from "../github";
import type { GraderSet } from "../executor-gate";
import { makeCourseTarball, PNG_1X1 } from "./_fixtures";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

/** Hand-authored managed docs unrelated to the sync (no marker → never pruned).
 *  They inflate the managed total the blast-radius guard measures against. */
const handAuthored = (n: number): SanityDoc[] =>
  Array.from({ length: n }, (_v, i) => ({
    _id: `hand-authored-${i}`,
    _type: "lesson",
  }));

const managedMarked = (id: string, type: string, rev: string): SanityDoc => ({
  _id: id,
  _type: type,
  sync: { source: "courses-academy", rev },
});

/**
 * Models Sanity `visibility:"async"`: `writeDocs` commits durably, but the next
 * `readManaged` LAGS for a configured subset of ids — they still read at their
 * pre-write value. This is exactly the read-your-writes window a post-write
 * read-back prune would race.
 */
class AsyncVisibilityGateway implements SanityGateway {
  written: SanityDoc[] = [];
  deleted: string[] = [];
  assets = new Set<string>();
  singleton: { sha: string; counts: Record<string, number> } | null = null;
  private visible: Map<string, SanityDoc>;

  constructor(
    existing: SanityDoc[],
    private laggingIds: Set<string>
  ) {
    this.visible = new Map(existing.map((d) => [d._id, d]));
  }

  async readManaged(): Promise<SanityDoc[]> {
    return [...this.visible.values()];
  }
  async writeDocs(docs: SanityDoc[]): Promise<void> {
    this.written.push(...docs);
    for (const d of docs) {
      // A lagging id keeps its previously-visible value on the next read.
      if (!this.laggingIds.has(d._id)) this.visible.set(d._id, d);
    }
  }
  async deleteDocs(ids: string[]): Promise<void> {
    this.deleted.push(...ids);
    for (const id of ids) this.visible.delete(id);
  }
  async assetExists(id: string): Promise<boolean> {
    return this.assets.has(id);
  }
  async uploadAsset(_bytes: Uint8Array, filename: string): Promise<string> {
    const id = `image-${filename}`;
    this.assets.add(id);
    return id;
  }
  async writeSingleton(
    sha: string,
    counts: Record<string, number>
  ): Promise<void> {
    this.singleton = { sha, counts };
  }
}

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
      sync: { source: "courses-academy", rev: "oldsha" },
    }));
    const gw = new InMemoryGateway(stale);
    await expect(runContentSync(deps({ gateway: gw }))).rejects.toBeInstanceOf(
      BlastRadiusError
    );
    expect(gw.deleted).toEqual([]); // never deleted anything
  });

  it("prunes a managed doc absent from the new tree and reports the count", async () => {
    // The two tree docs are kept (present in the projected set) even though they
    // are re-written from a stale rev; `lesson-gone` is ours but no longer in the
    // tree → pruned. Hand-authored docs pad the managed total so the single
    // removal stays under the 20% blast radius.
    const gw = new InMemoryGateway([
      managedMarked("course-demo", "course", "oldsha"),
      managedMarked("lesson-accounts", "lesson", "oldsha"),
      managedMarked("lesson-gone", "lesson", "oldsha"),
      ...handAuthored(4),
    ]);
    const result = await runContentSync(deps({ gateway: gw }));
    expect(gw.deleted).toEqual(["lesson-gone"]);
    expect(result.pruned).toBe(1);
  });

  it("async managed-read visibility never prunes a just-written doc; a removed doc still prunes", async () => {
    // Model Sanity `visibility:"async"`: after the write, the managed read-back
    // LAGS for `lesson-accounts` (it still reads at its OLD rev). Enough
    // hand-authored docs exist that a 2-doc stale read-back slips under the 20%
    // blast radius — so the OLD post-write-read prune would SILENTLY DELETE the
    // just-written `lesson-accounts`. Computing the prune set from the pre-write
    // read + projected ids makes that impossible: an id in the new tree is never
    // pruned, regardless of what the read-back reports.
    const existing: SanityDoc[] = [
      managedMarked("course-demo", "course", "oldsha"),
      managedMarked("lesson-accounts", "lesson", "oldsha"),
      managedMarked("lesson-removed", "lesson", "oldsha"),
      ...handAuthored(7),
    ];
    const gw = new AsyncVisibilityGateway(
      existing,
      new Set(["lesson-accounts"])
    );
    const result = await runContentSync(deps({ gateway: gw }));

    // The just-written tree docs are never in the delete set...
    expect(gw.written.map((d) => d._id)).toContain("lesson-accounts");
    expect(gw.deleted).not.toContain("lesson-accounts");
    expect(gw.deleted).not.toContain("course-demo");
    // ...but a doc genuinely absent from the new tree IS pruned.
    expect(gw.deleted).toEqual(["lesson-removed"]);
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
