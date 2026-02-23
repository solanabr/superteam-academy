import type { Context, Next } from "hono";

const DEFAULT_MAX_BODY_BYTES = 65_536;

export function bodyGuard(options?: { maxBytes?: number }) {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BODY_BYTES;

  return async (c: Context, next: Next) => {
    const method = c.req.method;
    if (method !== "POST" && method !== "PUT" && method !== "PATCH") {
      return next();
    }

    const contentType = c.req.header("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return c.json(
        { error: "Content-Type must be application/json" },
        415
      );
    }

    const contentLength = c.req.header("content-length");
    if (!contentLength) {
      return c.json(
        { error: "Content-Length header required for JSON body" },
        411
      );
    }

    const length = parseInt(contentLength, 10);
    if (!Number.isFinite(length) || length < 0) {
      return c.json({ error: "Invalid Content-Length" }, 400);
    }
    if (length > maxBytes) {
      return c.json(
        { error: `Request body too large (max ${maxBytes} bytes)` },
        413
      );
    }

    return next();
  };
}
