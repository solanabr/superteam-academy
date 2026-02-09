export interface RustExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

export async function executeRustCode(
  code: string,
  edition: "2015" | "2018" | "2021" = "2021"
): Promise<RustExecutionResult> {
  const response = await fetch("/api/rust/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, edition }),
  });

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({}))) as Partial<RustExecutionResult>;
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: body.error ?? `Server error (${response.status})`,
    };
  }

  return (await response.json()) as RustExecutionResult;
}
