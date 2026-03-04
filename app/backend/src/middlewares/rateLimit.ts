import rateLimit from "express-rate-limit";

// ─── Shared response format ───────────────────────────────────────────────────

const handler = (_req: any, res: any) => {
    res.status(429).json({
        success: false,
        message: "Too many requests — please slow down and try again later.",
    });
};

// ─── Auth limiter ─────────────────────────────────────────────────────────────
// Protects login, register, OTP endpoints.
// 10 attempts per 15 minutes per IP.

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
    message: "Too many auth attempts from this IP, please try again in 15 minutes.",
    skipSuccessfulRequests: true, // Only count failed attempts against the limit
});

// ─── Community limiter ────────────────────────────────────────────────────────
// Prevents thread/reply spam.
// 20 writes per 10 minutes per IP.

export const communityWriteLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,  // 10 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
});

// ─── Upload limiter ───────────────────────────────────────────────────────────
// File uploads are expensive — 10 per minute.

export const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
});

// ─── General API limiter ──────────────────────────────────────────────────────
// Applied globally as a baseline safety net.
// 200 requests per minute per IP.

export const generalLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
});
