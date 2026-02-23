import { timingSafeEqual } from "node:crypto";
import type { Context, Next } from "hono";

function getRequestToken(
  authorizationHeader: string | undefined,
  apiKeyHeader: string | undefined
): string | null {
  if (apiKeyHeader && apiKeyHeader.trim().length > 0) {
    return apiKeyHeader.trim();
  }

  if (!authorizationHeader) {
    return null;
  }

  const bearerPrefix = "Bearer ";
  if (authorizationHeader.startsWith(bearerPrefix)) {
    const token = authorizationHeader.slice(bearerPrefix.length).trim();
    return token.length > 0 ? token : null;
  }

  const token = authorizationHeader.trim();
  return token.length > 0 ? token : null;
}

export function tokenMatches(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export type ApiAuthValidator = (token: string) => boolean;

export function apiAuth(validator: string | ApiAuthValidator) {
  const check =
    typeof validator === "string"
      ? (t: string) => tokenMatches(t, validator)
      : validator;

  return async (c: Context, next: Next) => {
    const providedToken = getRequestToken(
      c.req.header("authorization"),
      c.req.header("x-api-key")
    );
    if (!providedToken || !check(providedToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    return next();
  };
}
