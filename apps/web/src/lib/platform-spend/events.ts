import "server-only";

import {
  captureServerEvent,
  PLATFORM_DISTINCT_ID,
  type ServerEventProperties,
} from "@/lib/analytics/server-capture";
import type { PayerRole } from "@/lib/solana/sponsor";

/**
 * Server-side PostHog events for platform spend. The builders are pure so the
 * payloads are testable; they take only the fields an event may carry. No
 * wallet address or email ever goes into one: a learner is identified by
 * `distinct_id` (their user id), which is what the browser identifies them as.
 */

export interface ServerEvent {
  event: string;
  distinctId: string;
  properties: ServerEventProperties;
}

export interface SettledSpend {
  signature: string;
  action: string;
  status: "confirmed" | "failed";
  payerRole: PayerRole;
  feeLamports: number;
  rentLamports: number;
  refundLamports: number;
  courseId: string | null;
  userId: string | null;
  cluster: string;
}

export function spendSettledEvent(spend: SettledSpend): ServerEvent {
  return {
    event: "platform_spend_settled",
    distinctId: spend.userId ?? PLATFORM_DISTINCT_ID,
    properties: {
      action: spend.action,
      status: spend.status,
      fee_lamports: spend.feeLamports,
      rent_lamports: spend.rentLamports,
      refund_lamports: spend.refundLamports,
      net_lamports:
        spend.feeLamports + spend.rentLamports - spend.refundLamports,
      payer_role: spend.payerRole,
      ...(spend.courseId ? { course_id: spend.courseId } : {}),
      cluster: spend.cluster,
      signature: spend.signature,
    },
  };
}

export function balanceSnapshotEvent(input: {
  payerRole: PayerRole;
  balanceLamports: number;
  cluster: string;
}): ServerEvent {
  return {
    event: "sponsor_balance_snapshot",
    distinctId: PLATFORM_DISTINCT_ID,
    properties: {
      payer_role: input.payerRole,
      balance_lamports: input.balanceLamports,
      cluster: input.cluster,
    },
  };
}

export function lowBalanceEvent(input: {
  payerRole: PayerRole;
  balanceLamports: number;
  thresholdLamports: number;
  cluster: string;
}): ServerEvent {
  return {
    event: "sponsor_low_balance",
    distinctId: PLATFORM_DISTINCT_ID,
    properties: {
      payer_role: input.payerRole,
      balance_lamports: input.balanceLamports,
      threshold_lamports: input.thresholdLamports,
      cluster: input.cluster,
    },
  };
}

export type SponsorDeclineReason = "already_sponsored" | "in_flight";

export function sponsorDeclinedEvent(input: {
  reason: SponsorDeclineReason;
  courseId: string;
  userId: string;
  cluster: string;
}): ServerEvent {
  return {
    event: "sponsor_declined",
    distinctId: input.userId,
    properties: {
      reason: input.reason,
      course_id: input.courseId,
      cluster: input.cluster,
    },
  };
}

/** Send one event. Never throws (see captureServerEvent). */
export function emitServerEvent(event: ServerEvent): Promise<void> {
  return captureServerEvent(event.event, event.distinctId, event.properties);
}
