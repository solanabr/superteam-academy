import { strict as assert } from "node:assert";
import { createApp } from "../src/app.ts";

type MockResult = {
  stdout: string;
  code: number;
  signal: string | null;
};

function buildMockRun(input: string): MockResult {
  if (input === "timeout") {
    return { stdout: "", code: 124, signal: "SIGTERM" };
  }
  if (input === "fail") {
    return { stdout: "wrong", code: 0, signal: null };
  }
  return { stdout: `ok:${input}`, code: 0, signal: null };
}

async function run() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (
    _url: string | URL | Request,
    init?: RequestInit,
  ) => {
    const payload = JSON.parse(String(init?.body ?? "{}")) as {
      stdin?: string;
    };
    const runResult = buildMockRun(payload.stdin ?? "");
    return new Response(
      JSON.stringify({
        run: {
          stdout: runResult.stdout,
          code: runResult.code,
          signal: runResult.signal,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof globalThis.fetch;

  try {
    const app = createApp({
      corsOrigin: "http://localhost:3000",
      authDomain: "localhost",
      authUri: "http://localhost:3000",
      authChainId: "solana:devnet",
    });

    const request = new Request("http://local/execute-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "console.log('ok')",
        language: "typescript",
        testCases: [
          { input: "a", expectedOutput: "ok:a", label: "A" },
          { input: "fail", expectedOutput: "ok:fail", label: "B" },
          { input: "timeout", expectedOutput: "", label: "C" },
        ],
      }),
    });

    const response = await app.request(request);
    const body = (await response.json()) as {
      ok: boolean;
      passed: boolean;
      results: Array<{ label: string; passed: boolean; timedOut: boolean }>;
    };

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.passed, false);
    assert.equal(body.results.length, 3);
    assert.equal(body.results[0]?.label, "A");
    assert.equal(body.results[0]?.passed, true);
    assert.equal(body.results[1]?.passed, false);
    assert.equal(body.results[2]?.timedOut, true);

    console.log("Gate 7 execute-code tests passed.");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

run().catch((error) => {
  console.error("Gate 7 execute-code tests failed.");
  console.error(error);
  process.exit(1);
});
