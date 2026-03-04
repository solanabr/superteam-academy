import { describe, it, expect } from 'vitest';
import {
    AppError,
    RpcError,
    ValidationError,
    ServiceError,
    isAppError,
    toSafeErrorResponse,
} from '@/backend/errors';

describe('AppError', () => {
    it('sets message, code, and statusCode', () => {
        const err = new AppError('test error', 'TEST_CODE', 418);
        expect(err.message).toBe('test error');
        expect(err.code).toBe('TEST_CODE');
        expect(err.statusCode).toBe(418);
        expect(err.name).toBe('AppError');
    });

    it('defaults statusCode to 500', () => {
        const err = new AppError('err', 'CODE');
        expect(err.statusCode).toBe(500);
    });

    it('is an instance of Error', () => {
        const err = new AppError('err', 'CODE');
        expect(err).toBeInstanceOf(Error);
    });

    it('preserves cause via ErrorOptions', () => {
        const cause = new Error('root cause');
        const err = new AppError('wrapped', 'WRAP', 500, { cause });
        expect(err.cause).toBe(cause);
    });
});

describe('RpcError', () => {
    it('has correct defaults', () => {
        const err = new RpcError('rpc failed');
        expect(err.name).toBe('RpcError');
        expect(err.code).toBe('RPC_ERROR');
        expect(err.statusCode).toBe(502);
    });

    it('is an instance of AppError', () => {
        expect(new RpcError('err')).toBeInstanceOf(AppError);
    });
});

describe('ValidationError', () => {
    it('has correct defaults', () => {
        const err = new ValidationError('bad input');
        expect(err.name).toBe('ValidationError');
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.statusCode).toBe(400);
    });

    it('is an instance of AppError', () => {
        expect(new ValidationError('err')).toBeInstanceOf(AppError);
    });
});

describe('ServiceError', () => {
    it('has correct defaults', () => {
        const err = new ServiceError('not found');
        expect(err.name).toBe('ServiceError');
        expect(err.code).toBe('SERVICE_ERROR');
        expect(err.statusCode).toBe(422);
    });

    it('accepts custom code and statusCode', () => {
        const err = new ServiceError('dup', 'DUPLICATE', 409);
        expect(err.code).toBe('DUPLICATE');
        expect(err.statusCode).toBe(409);
    });

    it('is an instance of AppError', () => {
        expect(new ServiceError('err')).toBeInstanceOf(AppError);
    });
});

describe('isAppError', () => {
    it('returns true for AppError instances', () => {
        expect(isAppError(new AppError('e', 'C'))).toBe(true);
        expect(isAppError(new RpcError('e'))).toBe(true);
        expect(isAppError(new ValidationError('e'))).toBe(true);
        expect(isAppError(new ServiceError('e'))).toBe(true);
    });

    it('returns false for plain errors and non-errors', () => {
        expect(isAppError(new Error('e'))).toBe(false);
        expect(isAppError('string')).toBe(false);
        expect(isAppError(null)).toBe(false);
        expect(isAppError(undefined)).toBe(false);
    });
});

describe('toSafeErrorResponse', () => {
    it('returns error details for AppError', () => {
        const err = new ValidationError('bad email');
        const resp = toSafeErrorResponse(err);
        expect(resp).toEqual({
            error: 'bad email',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
    });

    it('hides details for generic Error', () => {
        const resp = toSafeErrorResponse(new Error('internal details'));
        expect(resp).toEqual({
            error: 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
            statusCode: 500,
        });
    });

    it('hides details for non-Error values', () => {
        const resp = toSafeErrorResponse('crash');
        expect(resp.code).toBe('INTERNAL_ERROR');
    });
});
