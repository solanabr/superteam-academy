import { NextRequest, NextResponse } from "next/server";
import { finalizeCourse } from "@/lib/services/BackendSignerService";
import { fetchConfig, fetchCourse } from "@/lib/solana/queries";
import { XP_MINT } from "@/lib/solana/constants";
import { validateProgressRequest } from "@/lib/api/validate-progress-request";
import { checkRateLimit } from "@/lib/rate-limit";
import { ApiError, ApiErrorCode, apiErrorResponse, handleApiError } from "@/lib/api/errors";
import logger from "@/lib/logger";

const NO_STORE = "no-store";

export async function POST(request: NextRequest) {
  try {
    const result = await validateProgressRequest(request, {
      requireLessonIndex: false,
    });

    if (result instanceof NextResponse) return result;

    const { courseId, learner } = result;

    if (!checkRateLimit(`finalize:${learner.toBase58()}`, 5, 60_000)) {
      throw new ApiError(ApiErrorCode.RATE_LIMITED, "Too many requests");
    }

    const [xpMintResult, course] = await Promise.all([
      XP_MINT
        ? Promise.resolve(XP_MINT)
        : fetchConfig().then((c) => c?.xpMint ?? null),
      fetchCourse(courseId),
    ]);

    if (!xpMintResult || !course) {
      throw new ApiError(ApiErrorCode.ON_CHAIN_ERROR, "Config or course not found");
    }

    const sig = await finalizeCourse(
      learner,
      courseId,
      course.creator,
      xpMintResult
    );

    return NextResponse.json(
      { signature: sig },
      { headers: { "Cache-Control": NO_STORE } }
    );
  } catch (err: unknown) {
    const error = handleApiError(err);
    if (error.code === ApiErrorCode.INTERNAL_ERROR || error.code === ApiErrorCode.TRANSACTION_FAILED || error.code === ApiErrorCode.ON_CHAIN_ERROR) {
      logger.error("finalize-course error:", err);
    }
    return apiErrorResponse(error);
  }
}
