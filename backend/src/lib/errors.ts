import type { Context } from "hono";

type HttpStatus = 400 | 404 | 500;

export class HttpError extends Error {
  readonly status: HttpStatus;

  constructor(status: HttpStatus, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function isRetriableHttpError(status: number): boolean {
  return status >= 500 || status === 429;
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message);
}

export function notFound(message: string): HttpError {
  return new HttpError(404, message);
}

export function internalError(message: string): HttpError {
  return new HttpError(500, message);
}

function getMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

export function jsonError(c: Context, error: unknown): Response {
  if (error instanceof HttpError) {
    const retriable = isRetriableHttpError(error.status);
    return c.json({ error: error.message, retriable }, error.status);
  }
  return c.json({ error: getMessage(error), retriable: true }, 500);
}

export function withRouteErrorHandling(
  handler: (c: Context) => Promise<Response>
): (c: Context) => Promise<Response> {
  return async (c: Context): Promise<Response> => {
    try {
      return await handler(c);
    } catch (error) {
      return jsonError(c, error);
    }
  };
}
