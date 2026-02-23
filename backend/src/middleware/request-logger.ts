import { randomUUID } from "node:crypto";
import type { Context, Next } from "hono";

const REQUEST_ID_HEADER = "x-request-id";

export function getRequestId(c: Context): string | undefined {
  return c.get(REQUEST_ID_HEADER) as string | undefined;
}

export function requestLogger() {
  return async (c: Context, next: Next) => {
    const requestId =
      (c.req.header("x-request-id") as string | undefined) ?? randomUUID();
    c.set(REQUEST_ID_HEADER, requestId);

    const start = performance.now();
    const method = c.req.method;
    const path = c.req.path;

    const res = (await next()) as Response | void;
    const response = res instanceof Response ? res : c.res;

    const durationMs = Math.round(performance.now() - start);
    const status = response.status;

    const log = {
      requestId,
      method,
      path,
      status,
      durationMs,
      ts: new Date().toISOString(),
    };

    const out = JSON.stringify(log);
    if (status >= 500) {
      console.error(out);
    } else {
      console.log(out);
    }

    response.headers.set(REQUEST_ID_HEADER, requestId);
    return res ?? c.res;
  };
}
