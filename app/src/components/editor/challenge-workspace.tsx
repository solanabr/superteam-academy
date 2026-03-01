"use client";

import { CodeEditor } from "./code-editor";
import { SANDBOX_GLOBALS, MockPublicKey, MockTransactionInstruction } from "./sandbox";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Code2, Loader2, Play, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useState } from "react";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

interface ChallengeWorkspaceProps {
  starterCode: string;
  expectedOutput?: string;
  language?: "typescript" | "rust" | "javascript";
  challengeId?: string;
  onAllPassed?: () => void;
}

function stripImportsAndTypes(code: string): string {
  return code
    .replace(/^import\s+.*$/gm, "")
    .replace(/^export\s+/gm, "")
    .replace(/:\s*(PublicKey|TransactionInstruction|Buffer|number|string|bigint|boolean|void)\b(\[\])?/g, "")
    .replace(/:\s*\[PublicKey,\s*number\]/g, "")
    .replace(/:\s*Array<\w+>/g, "");
}

function runInSandbox(code: string): { func: (...args: unknown[]) => unknown; funcName: string } {
  const stripped = stripImportsAndTypes(code);

  const funcMatch = /function\s+(\w+)/.exec(stripped);
  if (!funcMatch) {
    throw new Error("No function found. Make sure you define the function (e.g. `function buildTransfer(...)`).");
  }
  const funcName = funcMatch[1];

  if (stripped.includes("// Your code here")) {
    throw new Error("Replace the `// Your code here` comment with your implementation.");
  }

  const globalNames = Object.keys(SANDBOX_GLOBALS);
  const globalValues = Object.values(SANDBOX_GLOBALS);

  // eslint-disable-next-line no-new-func
  const factory = new Function(
    ...globalNames,
    `"use strict";\n${stripped}\nreturn ${funcName};`,
  );
  const func = factory(...globalValues);

  if (typeof func !== "function") {
    throw new Error(`\`${funcName}\` was defined but is not a callable function.`);
  }

  return { func, funcName };
}

function runBuildTransferTests(func: (...args: unknown[]) => unknown): TestResult[] {
  const results: TestResult[] = [];
  const sender = new MockPublicKey("Sender11111111111111111111111111");
  const recipient = new MockPublicKey("Recipient111111111111111111111111");
  const lamports = 1_000_000_000;

  try {
    const ix = func(sender, recipient, lamports);

    const isInstruction = ix instanceof MockTransactionInstruction;
    const isObjectLike = !!(ix && typeof ix === "object" && "programId" in (ix as object));
    const passed = isInstruction || isObjectLike;
    results.push({
      name: "buildTransfer returns TransactionInstruction",
      passed,
      message: isInstruction
        ? "Correct — returned a TransactionInstruction"
        : isObjectLike
          ? "Returned an instruction-like object"
          : `Expected TransactionInstruction, got ${typeof ix}`,
    });

    if (isInstruction) {
      const castIx = ix as MockTransactionInstruction;
      const hasSigner = castIx.keys.some((k) => k.isSigner && k.isWritable);
      const hasRecipient = castIx.keys.some((k) =>
        k.pubkey.toBase58() === recipient.toBase58() && k.isWritable,
      );
      results.push({
        name: "buildTransfer sets correct accounts",
        passed: hasSigner && hasRecipient,
        message: hasSigner && hasRecipient
          ? "Sender is signer+writable, recipient is writable"
          : `Sender signer: ${hasSigner}, Recipient writable: ${hasRecipient}`,
      });
    }
  } catch (err) {
    results.push({
      name: "buildTransfer returns TransactionInstruction",
      passed: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}

function runDerivePdaTests(func: (...args: unknown[]) => unknown): TestResult[] {
  const results: TestResult[] = [];
  const learner = new MockPublicKey("Learner1111111111111111111111111");

  try {
    const result = func("solana-mock-test", learner);

    if (Array.isArray(result) && result.length === 2) {
      const [pda, bump] = result;
      results.push({
        name: "deriveEnrollmentPda returns [PublicKey, number]",
        passed: true,
        message: `PDA: ${pda?.toBase58?.() ?? pda}, bump: ${bump}`,
      });

      const bumpValid = typeof bump === "number" && bump >= 0 && bump <= 255;
      results.push({
        name: "Bump is valid (0-255)",
        passed: bumpValid,
        message: bumpValid ? `bump = ${bump}` : `Expected number 0-255, got ${bump}`,
      });
    } else {
      results.push({
        name: "deriveEnrollmentPda returns [PublicKey, number]",
        passed: false,
        message: `Expected [PublicKey, number] tuple, got ${JSON.stringify(result)}`,
      });
    }
  } catch (err) {
    results.push({
      name: "deriveEnrollmentPda returns [PublicKey, number]",
      passed: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}

const TEST_RUNNERS: Record<string, (func: (...args: unknown[]) => unknown) => TestResult[]> = {
  buildTransfer: runBuildTransferTests,
  deriveEnrollmentPda: runDerivePdaTests,
};

export function ChallengeWorkspace({
  starterCode,
  language = "typescript",
  onAllPassed,
}: ChallengeWorkspaceProps) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState<string[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  const runCode = useCallback(async () => {
    setRunning(true);
    setOutput([]);
    setResults([]);
    setAllPassed(false);

    await new Promise((r) => setTimeout(r, 200));

    const logs: string[] = [];
    let testResults: TestResult[] = [];

    try {
      const { func, funcName } = runInSandbox(code);
      logs.push(`\u2713 Function '${funcName}' compiled successfully`);

      const runner = TEST_RUNNERS[funcName];
      if (runner) {
        testResults = runner(func);
      } else {
        testResults.push({
          name: `${funcName} compiles`,
          passed: true,
          message: "Function is syntactically valid and callable",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logs.push(`Error: ${msg}`);
    }

    setOutput(logs);
    setResults(testResults);

    const passed = testResults.length > 0 && testResults.every((t) => t.passed);
    setAllPassed(passed);
    if (passed) onAllPassed?.();

    setRunning(false);
  }, [code, onAllPassed]);

  const resetCode = () => {
    setCode(starterCode);
    setOutput([]);
    setResults([]);
    setAllPassed(false);
  };

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Code2 className="size-4 text-highlight" />
          Coding challenge
        </h2>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-border bg-transparent text-xs"
            onClick={resetCode}
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
          <Button
            size="sm"
            className="h-7 bg-st-green text-xs text-white hover:bg-st-green/80"
            onClick={() => void runCode()}
            disabled={running}
          >
            {running ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
            {running ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      <div className="h-[320px] sm:h-[380px]">
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>

      <div className="border-t border-border">
        <div className="flex items-center gap-2 border-b border-border bg-surface-alt px-4 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Output</span>
          {allPassed && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-success">
              <CheckCircle2 className="size-3" /> All tests passed
            </span>
          )}
        </div>
        <div className="max-h-48 overflow-y-auto bg-surface px-4 py-3 font-mono text-xs">
          {output.length === 0 && results.length === 0 ? (
            <p className="text-muted-foreground/60">Click &quot;Run&quot; to execute your code...</p>
          ) : (
            <div className="space-y-1.5">
              {output.map((line, i) => (
                <p
                  key={i}
                  className={
                    line.startsWith("Error")
                      ? "text-danger"
                      : line.startsWith("\u2713")
                        ? "text-success"
                        : "text-muted-foreground"
                  }
                >
                  {line}
                </p>
              ))}
              {results.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  {r.passed ? (
                    <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
                  ) : (
                    <XCircle className="mt-0.5 size-3 shrink-0 text-danger" />
                  )}
                  <div>
                    <span className={r.passed ? "text-success" : "text-danger"}>
                      {r.name}: {r.passed ? "PASS" : "FAIL"}
                    </span>
                    {r.message && <p className="text-muted-foreground/70">{r.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
