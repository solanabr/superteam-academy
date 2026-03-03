/**
 * Shared error classes for Superteam Academy.
 *
 * Provides a consistent error hierarchy across all services:
 * - AppError — base with code + statusCode
 * - RpcError — Solana / external API failures
 * - ValidationError — input validation failures
 * - ServiceError — business logic violations
 *
 * All error classes set `name` for easy instanceof checks
 * and preserve the original cause when wrapping.
 */

// ─── Base ────────────────────────────────────────────────────────────

export class AppError extends Error {
    /** Machine-readable error code for programmatic handling */
    readonly code: string;
    /** HTTP status code to return in API responses */
    readonly statusCode: number;

    constructor(
        message: string,
        code: string,
        statusCode = 500,
        options?: ErrorOptions
    ) {
        super(message, options);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

// ─── RPC / External API ──────────────────────────────────────────────

/**
 * Error from Solana RPC or external API calls (Helius, etc.).
 * Use for transient failures that may be retryable.
 */
export class RpcError extends AppError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, 'RPC_ERROR', 502, options);
        this.name = 'RpcError';
    }
}

// ─── Validation ──────────────────────────────────────────────────────

/**
 * Input validation failure — invalid arguments, bad format, etc.
 */
export class ValidationError extends AppError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, 'VALIDATION_ERROR', 400, options);
        this.name = 'ValidationError';
    }
}

// ─── Business Logic ──────────────────────────────────────────────────

/**
 * Business rule violation — enrollment not found, already issued, etc.
 */
export class ServiceError extends AppError {
    constructor(
        message: string,
        code: string = 'SERVICE_ERROR',
        statusCode = 422,
        options?: ErrorOptions
    ) {
        super(message, code, statusCode, options);
        this.name = 'ServiceError';
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Type guard for AppError instances.
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}

/**
 * Extract a safe error message for API responses.
 * Hides internal details from non-AppError exceptions.
 */
export function toSafeErrorResponse(error: unknown): {
    error: string;
    code: string;
    statusCode: number;
} {
    if (isAppError(error)) {
        return {
            error: error.message,
            code: error.code,
            statusCode: error.statusCode,
        };
    }
    return {
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
    };
}
