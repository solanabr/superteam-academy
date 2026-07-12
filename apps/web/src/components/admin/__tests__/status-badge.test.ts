import { describe, it, expect } from "vitest";
import { contentDriftBadgeState } from "../status-badge";

describe("contentDriftBadgeState", () => {
  it("surfaces content drift only on a deployed course", () => {
    expect(contentDriftBadgeState("synced", "behind")).toBe("drifted");
    expect(contentDriftBadgeState("out_of_sync", "behind")).toBe("drifted");
  });

  it("maps a red-CI upstream commit to the blocked state", () => {
    expect(contentDriftBadgeState("synced", "blocked")).toBe("blocked");
  });

  it("surfaces an explicit unknown when HEAD could not be fetched", () => {
    expect(contentDriftBadgeState("synced", "unknown")).toBe("unknown");
  });

  it("shows nothing when content is current", () => {
    expect(contentDriftBadgeState("synced", "up_to_date")).toBe("none");
    expect(contentDriftBadgeState("synced", "never_synced")).toBe("none");
  });

  it("shows nothing for a course that is not on chain yet", () => {
    // Never-deployed courses render the on-chain badge only — content drift is
    // moot until the first deploy.
    expect(contentDriftBadgeState("not_deployed", "behind")).toBe("none");
    expect(contentDriftBadgeState("missing_fields", "behind")).toBe("none");
    expect(contentDriftBadgeState("draft", "behind")).toBe("none");
  });
});
