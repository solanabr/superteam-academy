import { NextResponse } from "next/server";

export const ApiErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_INPUT: "INVALID_INPUT",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  WALLET_REQUIRED: "WALLET_REQUIRED",
  SIGNATURE_INVALID: "SIGNATURE_INVALID",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  ON_CHAIN_ERROR: "ON_CHAIN_ERROR",
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

const STATUS_MAP: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  WALLET_REQUIRED: 401,
  SIGNATURE_INVALID: 403,
  TRANSACTION_FAILED: 500,
  ON_CHAIN_ERROR: 502,
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = STATUS_MAP[code];
    this.details = details;
  }
}

export function apiErrorResponse(error: ApiError): NextResponse {
  const body: { code: string; message: string; details?: unknown } = {
    code: error.code,
    message: error.message,
  };
  if (error.details !== undefined) {
    body.details = error.details;
  }
  return NextResponse.json({ error: body }, { status: error.statusCode });
}

export function handleApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  // Extract Anchor on-chain error code (e.g., LessonAlreadyCompleted, CourseNotActive)
  const anchorErr = err as { error?: { errorCode?: { code?: string; number?: number } }; message?: string };
  if (anchorErr?.error?.errorCode?.code) {
    return new ApiError(
      ApiErrorCode.ON_CHAIN_ERROR,
      anchorErr.error.errorCode.code,
      { errorNumber: anchorErr.error.errorCode.number }
    );
  }

  // Check for Anchor transaction simulation errors with logs
  if (err instanceof Error && err.message?.includes("Transaction simulation failed")) {
    return new ApiError(ApiErrorCode.TRANSACTION_FAILED, err.message);
  }

  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";
  return new ApiError(ApiErrorCode.INTERNAL_ERROR, message);
}
