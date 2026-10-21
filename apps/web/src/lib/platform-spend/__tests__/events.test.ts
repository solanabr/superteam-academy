/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/analytics/server-capture", () => ({
  captureServerEvent: vi.fn(),
  PLATFORM_DISTINCT_ID: "platform",
}));

import {
  lowBalanceEvent,
  spendSettledEvent,
  sponsorDeclinedEvent,
} from "../events";

/** Property names that would carry a wallet address or a person's contact. */
const PII_KEYS = /wallet|address|email|payer$|pubkey|learner/i;

function assertNoPiiKeys(properties: Record<string, unknown>) {
  for (const key of Object.keys(properties)) {
    expect(key).not.toMatch(PII_KEYS);
  }
}

describe("spend events", () => {
  it("platform_spend_settled carries amounts and net, keyed to the learner", () => {
    const event = spendSettledEvent({
      signature: "SIG",
      action: "credential",
      status: "confirmed",
      payerRole: "sponsor",
      feeLamports: 5_000,
      rentLamports: 3_000_000,
      refundLamports: 1_000,
      courseId: "course-x",
      userId: "user-1",
      cluster: "mainnet",
    });

    expect(event.distinctId).toBe("user-1");
    expect(event.properties.net_lamports).toBe(5_000 + 3_000_000 - 1_000);
    assertNoPiiKeys(event.properties);
  });

  it("omits course_id when unknown and falls back to the platform id", () => {
    const event = spendSettledEvent({
      signature: "SIG",
      action: "achievement",
      status: "confirmed",
      payerRole: "sponsor",
      feeLamports: 5_000,
      rentLamports: 0,
      refundLamports: 0,
      courseId: null,
      userId: null,
      cluster: "devnet",
    });

    expect(event.distinctId).toBe("platform");
    expect(event.properties).not.toHaveProperty("course_id");
  });

  it("sponsor_declined says why and for which course, nothing else", () => {
    const event = sponsorDeclinedEvent({
      reason: "already_sponsored",
      courseId: "course-x",
      userId: "user-1",
      cluster: "devnet",
    });

    expect(event).toEqual({
      event: "sponsor_declined",
      distinctId: "user-1",
      properties: {
        reason: "already_sponsored",
        course_id: "course-x",
        cluster: "devnet",
      },
    });
  });

  it("sponsor_low_balance is a platform event without addresses", () => {
    const event = lowBalanceEvent({
      payerRole: "backend",
      balanceLamports: 1,
      thresholdLamports: 2,
      cluster: "devnet",
    });
    expect(event.distinctId).toBe("platform");
    assertNoPiiKeys(event.properties);
  });
});
