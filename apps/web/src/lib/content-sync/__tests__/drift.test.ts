import { describe, it, expect } from "vitest";
import {
  computeContentDrift,
  computeChainDrift,
  assertCommitSyncable,
} from "../drift";
import { padContentTxId } from "../content-commit";
import { BlockedCommitError } from "../types";

const HEAD = "b".repeat(40);

describe("computeContentDrift", () => {
  it("never_synced when there is no contentSync doc", () => {
    expect(
      computeContentDrift({ syncedSha: null, headSha: HEAD, checks: "success" })
    ).toEqual({
      state: "never_synced",
      canSync: true,
    });
  });

  it("up_to_date when synced sha equals HEAD", () => {
    expect(
      computeContentDrift({ syncedSha: HEAD, headSha: HEAD, checks: "success" })
    ).toEqual({
      state: "up_to_date",
      canSync: false,
    });
  });

  it("blocked (cannot sync) when HEAD's CI is failing", () => {
    expect(
      computeContentDrift({
        syncedSha: "old",
        headSha: HEAD,
        checks: "failure",
      })
    ).toEqual({
      state: "blocked",
      canSync: false,
    });
  });

  it("behind when HEAD is ahead and CI is green", () => {
    expect(
      computeContentDrift({
        syncedSha: "old",
        headSha: HEAD,
        checks: "success",
      })
    ).toEqual({
      state: "behind",
      canSync: true,
    });
  });

  it("blocked overrides never_synced when HEAD is red", () => {
    expect(
      computeContentDrift({ syncedSha: null, headSha: HEAD, checks: "failure" })
        .canSync
    ).toBe(false);
  });
});

describe("computeChainDrift", () => {
  it("content_current when content_tx_id equals the padded HEAD sha", () => {
    expect(
      computeChainDrift({
        onChainContentTxId: padContentTxId(HEAD),
        headSha: HEAD,
        diffStatus: "synced",
        contentUpToDate: true,
      })
    ).toBe("content_current");
  });

  it("content_stale when the tx id is the legacy zeros", () => {
    expect(
      computeChainDrift({
        onChainContentTxId: Array(32).fill(0),
        headSha: HEAD,
        diffStatus: "synced",
        contentUpToDate: true,
      })
    ).toBe("content_stale");
  });

  it("passes through not_deployed from diffCourse", () => {
    expect(
      computeChainDrift({
        onChainContentTxId: null,
        headSha: HEAD,
        diffStatus: "not_deployed",
        contentUpToDate: true,
      })
    ).toBe("not_deployed");
  });

  it("blocks the chain-drift verdict until content sync has landed (ordering interlock)", () => {
    expect(
      computeChainDrift({
        onChainContentTxId: null,
        headSha: HEAD,
        diffStatus: "synced",
        contentUpToDate: false,
      })
    ).toBe("awaiting_content_sync");
  });
});

describe("assertCommitSyncable", () => {
  it("throws BlockedCommitError on red CI", () => {
    expect(() => assertCommitSyncable("failure", "sha")).toThrow(
      BlockedCommitError
    );
  });
  it("throws on pending CI (do not sync an unfinished commit)", () => {
    expect(() => assertCommitSyncable("pending", "sha")).toThrow(
      BlockedCommitError
    );
  });
  it("passes on green CI", () => {
    expect(() => assertCommitSyncable("success", "sha")).not.toThrow();
  });
});
