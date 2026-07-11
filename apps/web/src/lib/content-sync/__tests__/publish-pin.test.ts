import { describe, it, expect } from "vitest";
import {
  computePublishVerdict,
  shortSha,
  contentTreeUrl,
  contentCompareUrl,
  suggestBranchName,
  buildLockDiff,
  buildPrTitle,
  buildPrBody,
  buildPublishPrUrl,
  CONTENT_REPO,
  APP_REPO,
  LOCK_PATH,
} from "../publish-pin";

const PIN = "401c7df1035061337dd209ea8a8c7272d3223cbc";
const HEAD = "b".repeat(40);

describe("computePublishVerdict", () => {
  it("is up_to_date when the pin equals HEAD", () => {
    const v = computePublishVerdict({
      pinnedSha: PIN,
      headSha: PIN,
      aheadBy: 0,
      headChecks: "success",
    });
    expect(v.state).toBe("up_to_date");
    expect(v.commitsBehind).toBe(0);
    expect(v.warnRedHead).toBe(false);
  });

  it("is behind with the compare ahead_by when drifted and CI green", () => {
    const v = computePublishVerdict({
      pinnedSha: PIN,
      headSha: HEAD,
      aheadBy: 3,
      headChecks: "success",
    });
    expect(v.state).toBe("behind");
    expect(v.commitsBehind).toBe(3);
    expect(v.warnRedHead).toBe(false);
  });

  it("warns when drifted and HEAD CI is failing", () => {
    const v = computePublishVerdict({
      pinnedSha: PIN,
      headSha: HEAD,
      aheadBy: 1,
      headChecks: "failure",
    });
    expect(v.warnRedHead).toBe(true);
  });

  it("warns when drifted and HEAD CI is still pending", () => {
    const v = computePublishVerdict({
      pinnedSha: PIN,
      headSha: HEAD,
      aheadBy: 1,
      headChecks: "pending",
    });
    expect(v.warnRedHead).toBe(true);
  });

  it("carries a null commit count when the compare call was skipped", () => {
    const v = computePublishVerdict({
      pinnedSha: PIN,
      headSha: HEAD,
      aheadBy: null,
      headChecks: "success",
    });
    expect(v.state).toBe("behind");
    expect(v.commitsBehind).toBeNull();
  });
});

describe("shortSha", () => {
  it("truncates to 7 chars", () => {
    expect(shortSha(PIN)).toBe("401c7df");
  });
  it("returns an em-dash for null/undefined", () => {
    expect(shortSha(null)).toBe("—");
    expect(shortSha(undefined)).toBe("—");
  });
});

describe("links", () => {
  it("builds a content-repo tree URL at the sha", () => {
    expect(contentTreeUrl(PIN)).toBe(
      `https://github.com/${CONTENT_REPO}/tree/${PIN}`
    );
  });

  it("builds a content-repo compare URL pin...HEAD", () => {
    expect(contentCompareUrl(PIN, HEAD)).toBe(
      `https://github.com/${CONTENT_REPO}/compare/${PIN}...${HEAD}`
    );
  });

  it("suggests a branch name from the short HEAD sha", () => {
    expect(suggestBranchName(HEAD)).toBe("chore/content-pin-bbbbbbb");
  });

  it("builds a prefilled app-repo PR link with encoded title/body", () => {
    const url = buildPublishPrUrl({ pinnedSha: PIN, headSha: HEAD });
    expect(url.startsWith(`https://github.com/${APP_REPO}/compare/main?`)).toBe(
      true
    );
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("quick_pull")).toBe("1");
    expect(params.get("title")).toContain("bump content.lock");
    expect(params.get("body")).toContain(LOCK_PATH);
  });
});

describe("buildLockDiff", () => {
  it("emits the one-line sha change against the lock path", () => {
    const diff = buildLockDiff(PIN, HEAD);
    expect(diff).toContain(`--- a/${LOCK_PATH}`);
    expect(diff).toContain(`-  "sha": "${PIN}"`);
    expect(diff).toContain(`+  "sha": "${HEAD}"`);
  });
});

describe("PR text", () => {
  it("titles the PR with the short HEAD sha", () => {
    expect(buildPrTitle(HEAD)).toContain("bbbbbbb");
  });

  it("includes the compile command and commit count in the body", () => {
    const body = buildPrBody({
      pinnedSha: PIN,
      headSha: HEAD,
      commitsBehind: 4,
    });
    expect(body).toContain("pnpm --filter web compile-content");
    expect(body).toContain("4 commit(s)");
  });

  it("omits the commit-count sentence when unknown", () => {
    const body = buildPrBody({
      pinnedSha: PIN,
      headSha: HEAD,
      commitsBehind: null,
    });
    expect(body).not.toContain("commit(s)");
  });
});
