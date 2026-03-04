import { z } from "zod";
import { env } from "@/lib/env";
import type { TestCase } from "@/lib/data/types";

const executeCodeResponseSchema = z.object({
  ok: z.literal(true),
  passed: z.boolean(),
  results: z.array(
    z.object({
      input: z.string(),
      expected: z.string(),
      actual: z.string(),
      label: z.string(),
      passed: z.boolean(),
      timedOut: z.boolean(),
      exitCode: z.number().nullable(),
    }),
  ),
});

const executeCodeErrorSchema = z.object({
  ok: z.boolean().optional(),
  error: z.string().optional(),
});

export class ExecuteCodeError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = status;
  }
}

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export async function executeCodeWithBackend(input: {
  code: string;
  language: "rust" | "typescript";
  testCases: TestCase[];
}): Promise<z.infer<typeof executeCodeResponseSchema>> {
  const response = await fetch(
    `${normalizeApiBaseUrl(env.NEXT_PUBLIC_ACADEMY_API_URL)}/execute-code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    const parsedError = executeCodeErrorSchema.safeParse(payload);
    throw new ExecuteCodeError(
      parsedError.success
        ? (parsedError.data.error ?? "EXECUTE_CODE_FAILED")
        : "EXECUTE_CODE_FAILED",
      response.status,
    );
  }

  return executeCodeResponseSchema.parse(payload);
}
