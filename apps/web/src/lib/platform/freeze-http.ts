import "server-only";

import { NextResponse } from "next/server";

/**
 * The clean "try later" a front route returns while the platform is globally
 * frozen (reset wave B2). A real 503 — NOT a failed on-chain tx — so a learner
 * is told to retry rather than watching a transaction revert.
 *
 * `maintenance: true` is the machine-readable signal (per the B2 contract); the
 * `error` string keeps existing clients that only read `error` working. Shared
 * across every gated route so the shape never drifts.
 */
export function platformFrozenResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        "Superteam Academy is undergoing scheduled maintenance. Please try again in a few minutes.",
      maintenance: true,
    },
    { status: 503, headers: { "Retry-After": "120" } }
  );
}
