import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { checkRateLimit } from "@/lib/rate-limit";
import { getHeliusRpcUrl } from "@/lib/solana/helius";
import { ApiError, ApiErrorCode, apiErrorResponse, handleApiError } from "@/lib/api/errors";

const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!checkRateLimit(`asset:${ip}`, 30, 60_000)) {
      throw new ApiError(ApiErrorCode.RATE_LIMITED, "Too many requests");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid request body");
    }

    const { assetId } = body as Record<string, unknown>;
    if (!assetId || typeof assetId !== "string") {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Missing or invalid assetId");
    }

    try {
      new PublicKey(assetId);
    } catch {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid asset ID");
    }

    let res: Response;
    try {
      res = await fetch(getHeliusRpcUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "getAsset",
          method: "getAsset",
          params: { id: assetId },
        }),
      });
    } catch {
      throw new ApiError(ApiErrorCode.ON_CHAIN_ERROR, "RPC unreachable");
    }

    if (!res.ok) {
      throw new ApiError(ApiErrorCode.ON_CHAIN_ERROR, "RPC error");
    }

    const data = (await res.json()) as {
      result?: unknown;
      error?: { message?: string };
    };

    if (data.error) {
      throw new ApiError(
        ApiErrorCode.ON_CHAIN_ERROR,
        data.error.message ?? "RPC error"
      );
    }

    if (data.result === null || data.result === undefined) {
      throw new ApiError(ApiErrorCode.NOT_FOUND, "Asset not found");
    }

    return NextResponse.json(data.result, {
      headers: { "Cache-Control": PUBLIC_CACHE },
    });
  } catch (err: unknown) {
    return apiErrorResponse(handleApiError(err));
  }
}
