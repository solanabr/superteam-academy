interface LogErrorParams {
  errorId: string;
  error: Error;
  context?: Record<string, unknown>;
}

export function logError({ errorId, error, context }: LogErrorParams): void {
  console.error(`[${errorId}]`, error.message, context ?? "");
}
