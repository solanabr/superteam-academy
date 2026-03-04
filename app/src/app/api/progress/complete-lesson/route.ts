import { NextRequest, NextResponse } from "next/server";
import { completeLesson } from "@/lib/services/BackendSignerService";
import { fetchConfig } from "@/lib/solana/queries";
import { XP_MINT } from "@/lib/solana/constants";
import { validateProgressRequest } from "@/lib/api/validate-progress-request";
import { checkRateLimit } from "@/lib/rate-limit";
import { ApiError, ApiErrorCode, apiErrorResponse, handleApiError } from "@/lib/api/errors";
import logger from "@/lib/logger";

const NO_STORE = "no-store";

export async function POST(request: NextRequest) {
  try {
    const result = await validateProgressRequest(request, {
      requireLessonIndex: true,
    });

    if (result instanceof NextResponse) return result;

    const { courseId, learner, lessonIndex } = result;

    if (lessonIndex === undefined) {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "lessonIndex required");
    }

    if (!checkRateLimit(`complete:${learner.toBase58()}`, 10, 60_000)) {
      throw new ApiError(ApiErrorCode.RATE_LIMITED, "Too many requests");
    }

    let xpMint = XP_MINT;
    if (!xpMint) {
      const config = await fetchConfig();
      if (!config) {
        throw new ApiError(ApiErrorCode.ON_CHAIN_ERROR, "Config not found");
      }
      xpMint = config.xpMint;
    }

    const sig = await completeLesson(learner, courseId, lessonIndex, xpMint);

    return NextResponse.json(
      { signature: sig },
      { headers: { "Cache-Control": NO_STORE } }
    );
  } catch (err: unknown) {
    const error = handleApiError(err);
    if (error.code === ApiErrorCode.INTERNAL_ERROR || error.code === ApiErrorCode.TRANSACTION_FAILED || error.code === ApiErrorCode.ON_CHAIN_ERROR) {
      logger.error("complete-lesson error:", err);
    }
    return apiErrorResponse(error);
  }
}
