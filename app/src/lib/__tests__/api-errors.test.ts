import { describe, it, expect, vi } from "vitest";

// Mock next/server so NextResponse.json works outside of Next.js runtime
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => {
      const status = init?.status ?? 200;
      return { status, body };
    },
  },
}));

import {
  ApiError,
  ApiErrorCode,
  apiErrorResponse,
  handleApiError,
} from "../api/errors";

// ---------------------------------------------------------------------------
// ApiError construction
// ---------------------------------------------------------------------------

describe("ApiError — construction", () => {
  it("sets name to ApiError", () => {
    const err = new ApiError(ApiErrorCode.UNAUTHORIZED, "not allowed");
    expect(err.name).toBe("ApiError");
  });

  it("is an instance of Error", () => {
    const err = new ApiError(ApiErrorCode.INTERNAL_ERROR, "oops");
    expect(err).toBeInstanceOf(Error);
  });

  it("is an instance of ApiError", () => {
    const err = new ApiError(ApiErrorCode.NOT_FOUND, "missing");
    expect(err).toBeInstanceOf(ApiError);
  });

  it("stores the message", () => {
    const err = new ApiError(ApiErrorCode.INVALID_INPUT, "bad input");
    expect(err.message).toBe("bad input");
  });

  it("stores the code", () => {
    const err = new ApiError(ApiErrorCode.RATE_LIMITED, "slow down");
    expect(err.code).toBe("RATE_LIMITED");
  });

  it("stores details when provided", () => {
    const details = { field: "walletAddress" };
    const err = new ApiError(ApiErrorCode.INVALID_INPUT, "bad field", details);
    expect(err.details).toEqual({ field: "walletAddress" });
  });

  it("details is undefined when not provided", () => {
    const err = new ApiError(ApiErrorCode.NOT_FOUND, "not found");
    expect(err.details).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Status code mapping
// ---------------------------------------------------------------------------

describe("ApiError — statusCode mapping", () => {
  const cases: [ApiErrorCode, number][] = [
    [ApiErrorCode.UNAUTHORIZED, 401],
    [ApiErrorCode.FORBIDDEN, 403],
    [ApiErrorCode.INVALID_INPUT, 400],
    [ApiErrorCode.NOT_FOUND, 404],
    [ApiErrorCode.RATE_LIMITED, 429],
    [ApiErrorCode.INTERNAL_ERROR, 500],
    [ApiErrorCode.WALLET_REQUIRED, 401],
    [ApiErrorCode.SIGNATURE_INVALID, 403],
    [ApiErrorCode.TRANSACTION_FAILED, 500],
    [ApiErrorCode.ON_CHAIN_ERROR, 502],
  ];

  for (const [code, expectedStatus] of cases) {
    it(`${code} maps to HTTP ${expectedStatus}`, () => {
      const err = new ApiError(code, "test");
      expect(err.statusCode).toBe(expectedStatus);
    });
  }
});

// ---------------------------------------------------------------------------
// apiErrorResponse
// ---------------------------------------------------------------------------

describe("apiErrorResponse — returns correct status and body", () => {
  it("returns 401 for UNAUTHORIZED", () => {
    const err = new ApiError(ApiErrorCode.UNAUTHORIZED, "not authorized");
    const res = apiErrorResponse(err) as unknown as { status: number; body: { error: { code: string; message: string } } };
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(res.body.error.message).toBe("not authorized");
  });

  it("returns 404 for NOT_FOUND", () => {
    const err = new ApiError(ApiErrorCode.NOT_FOUND, "resource missing");
    const res = apiErrorResponse(err) as unknown as { status: number; body: unknown };
    expect(res.status).toBe(404);
  });

  it("returns 429 for RATE_LIMITED", () => {
    const err = new ApiError(ApiErrorCode.RATE_LIMITED, "slow down");
    const res = apiErrorResponse(err) as unknown as { status: number };
    expect(res.status).toBe(429);
  });

  it("includes details in body when present", () => {
    const details = { retryAfter: 60 };
    const err = new ApiError(ApiErrorCode.RATE_LIMITED, "slow down", details);
    const res = apiErrorResponse(err) as unknown as { body: { error: { details: unknown } } };
    expect(res.body.error.details).toEqual({ retryAfter: 60 });
  });

  it("omits details key from body when not provided", () => {
    const err = new ApiError(ApiErrorCode.UNAUTHORIZED, "not authorized");
    const res = apiErrorResponse(err) as unknown as { body: { error: Record<string, unknown> } };
    expect("details" in res.body.error).toBe(false);
  });

  it("returns 502 for ON_CHAIN_ERROR", () => {
    const err = new ApiError(ApiErrorCode.ON_CHAIN_ERROR, "rpc down");
    const res = apiErrorResponse(err) as unknown as { status: number };
    expect(res.status).toBe(502);
  });
});

// ---------------------------------------------------------------------------
// handleApiError
// ---------------------------------------------------------------------------

describe("handleApiError — wrapping unknown errors", () => {
  it("returns the same ApiError if input is already an ApiError", () => {
    const original = new ApiError(ApiErrorCode.NOT_FOUND, "missing");
    const result = handleApiError(original);
    expect(result).toBe(original);
  });

  it("wraps a plain Error into an INTERNAL_ERROR ApiError", () => {
    const plain = new Error("something broke");
    const result = handleApiError(plain);
    expect(result).toBeInstanceOf(ApiError);
    expect(result.code).toBe("INTERNAL_ERROR");
    expect(result.message).toBe("something broke");
    expect(result.statusCode).toBe(500);
  });

  it("wraps a string error into an INTERNAL_ERROR ApiError with generic message", () => {
    const result = handleApiError("some string error");
    expect(result.code).toBe("INTERNAL_ERROR");
    expect(result.message).toBe("An unexpected error occurred");
  });

  it("wraps null into INTERNAL_ERROR with generic message", () => {
    const result = handleApiError(null);
    expect(result.code).toBe("INTERNAL_ERROR");
    expect(result.message).toBe("An unexpected error occurred");
  });

  it("wraps undefined into INTERNAL_ERROR with generic message", () => {
    const result = handleApiError(undefined);
    expect(result.code).toBe("INTERNAL_ERROR");
  });

  it("wraps an object (non-Error) into INTERNAL_ERROR", () => {
    const result = handleApiError({ weird: true });
    expect(result.code).toBe("INTERNAL_ERROR");
  });

  it("preserves sub-class ApiError identity (FORBIDDEN stays FORBIDDEN)", () => {
    const original = new ApiError(ApiErrorCode.FORBIDDEN, "no access");
    const result = handleApiError(original);
    expect(result.code).toBe("FORBIDDEN");
    expect(result.statusCode).toBe(403);
  });
});
