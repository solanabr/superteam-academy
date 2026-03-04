import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getCredentialsByOwner } from "@/lib/solana/helius";
import { checkRateLimit } from "@/lib/rate-limit";
import { ApiError, ApiErrorCode, apiErrorResponse, handleApiError } from "@/lib/api/errors";

const PRIVATE_CACHE = "private, max-age=30";

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!checkRateLimit(`helius-creds:${ip}`, 30, 60_000)) {
      throw new ApiError(ApiErrorCode.RATE_LIMITED, "Too many requests");
    }

    const owner = request.nextUrl.searchParams.get("owner");
    if (!owner || typeof owner !== "string") {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Missing or invalid owner");
    }

    try {
      new PublicKey(owner);
    } catch {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid public key");
    }

    let credentials: Awaited<ReturnType<typeof getCredentialsByOwner>>;
    try {
      credentials = await getCredentialsByOwner(owner);
    } catch (err) {
      throw new ApiError(
        ApiErrorCode.ON_CHAIN_ERROR,
        "Failed to fetch credentials",
        err instanceof Error ? err.message : undefined
      );
    }

    return NextResponse.json(credentials, {
      headers: { "Cache-Control": PRIVATE_CACHE },
    });
  } catch (err: unknown) {
    return apiErrorResponse(handleApiError(err));
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!checkRateLimit(`helius-creds:${ip}`, 30, 60_000)) {
      throw new ApiError(ApiErrorCode.RATE_LIMITED, "Too many requests");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid request body");
    }

    const { owner } = body as Record<string, unknown>;
    if (!owner || typeof owner !== "string") {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Missing or invalid owner");
    }

    try {
      new PublicKey(owner);
    } catch {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid public key");
    }

    let credentials: Awaited<ReturnType<typeof getCredentialsByOwner>>;
    try {
      credentials = await getCredentialsByOwner(owner);
    } catch (err) {
      throw new ApiError(
        ApiErrorCode.ON_CHAIN_ERROR,
        "Failed to fetch credentials",
        err instanceof Error ? err.message : undefined
      );
    }

    return NextResponse.json(credentials, {
      headers: { "Cache-Control": PRIVATE_CACHE },
    });
  } catch (err: unknown) {
    return apiErrorResponse(handleApiError(err));
  }
}
