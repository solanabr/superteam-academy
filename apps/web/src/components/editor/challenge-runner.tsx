"use client";

import { useCallback, useEffect, useState } from "react";
import { transform as sucraseTransform } from "sucrase";
import { useTranslations } from "next-intl";
import { Play } from "@phosphor-icons/react";
import type { TestCase } from "@superteam-lms/types";
import { Keypair } from "@solana/web3.js";
import { setCachedBinary } from "@superteam-lms/deploy";
import type {
  ChallengeRunnerProps,
  ExecutionResult,
  TestResult,
} from "./types";
import { executeRustCode } from "@/lib/rust/execute";
import { buildProgram } from "@/lib/build-server/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Web Worker sandbox — all user code executes in a separate thread with no
// DOM access.  The worker can be terminated to kill infinite loops.
// ---------------------------------------------------------------------------

/** Plain-JS source that runs inside the Worker.  No TypeScript, no imports. */
const WORKER_SOURCE = `
"use strict";

/* ── Mock Solana SDK ─────────────────────────────────────────────────── */

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function toBase58(bytes) {
  let result = "";
  for (const byte of bytes) result += BASE58_ALPHABET[byte % 58];
  return result;
}

function randomBytes(n) {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

class MockPublicKey {
  constructor(value) {
    if (typeof value === "string") {
      // Validate base58: 32-44 chars, only base58 alphabet
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
        throw new Error("Invalid public key input");
      }
      this._bytes = new Uint8Array(32);
    } else {
      this._bytes = value ?? randomBytes(32);
    }
  }
  toBase58() { return toBase58(this._bytes); }
  toString() { return this.toBase58(); }
  toJSON()   { return this.toBase58(); }
  toBytes()  { return this._bytes; }
  equals(other) {
    if (!other || !other._bytes) return false;
    return this.toBase58() === other.toBase58();
  }
  static isOnCurve() { return true; }
  static findProgramAddressSync(seeds, programId) {
    void programId;
    const combined = new Uint8Array(seeds.reduce(function(a,s){ return a+s.length; }, 0) + 1);
    let offset = 0;
    for (const s of seeds) { combined.set(s, offset); offset += s.length; }
    combined[offset] = 254;
    const hash = new Uint8Array(32);
    for (let i = 0; i < 32; i++) hash[i] = (combined[i % combined.length] || 0) ^ 0x5a;
    return [new MockPublicKey(hash), 254];
  }
}

class MockKeypair {
  constructor() {
    this.secretKey = randomBytes(64);
    this.publicKey = new MockPublicKey(this.secretKey.slice(32));
  }
  static generate() { return new MockKeypair(); }
  static fromSecretKey(sk) {
    const kp = new MockKeypair();
    kp.secretKey = sk;
    kp.publicKey = new MockPublicKey(sk.slice(32));
    return kp;
  }
}

class MockTransaction {
  constructor() { this.instructions = []; }
  add() {
    for (let i = 0; i < arguments.length; i++) this.instructions.push(arguments[i]);
    return this;
  }
}

class MockConnection {
  constructor() {}
  async requestAirdrop()      { return "mock-airdrop-sig"; }
  async confirmTransaction()  {}
  async getBalance()          { return 2000000000; }
}

const MockSystemProgram = {
  transfer: function(params) {
    return Object.assign({ programId: "11111111111111111111111111111111" }, params);
  },
};

const LAMPORTS_PER_SOL = 1000000000;
async function mockCreateMint() { return new MockPublicKey(); }

Object.freeze(MockPublicKey.prototype);
Object.freeze(MockKeypair.prototype);
Object.freeze(MockTransaction.prototype);
Object.freeze(MockConnection.prototype);

const __modules__ = {
  "@solana/web3.js": {
    Keypair: MockKeypair,
    PublicKey: MockPublicKey,
    Connection: MockConnection,
    Transaction: MockTransaction,
    SystemProgram: MockSystemProgram,
    LAMPORTS_PER_SOL: LAMPORTS_PER_SOL,
    sendAndConfirmTransaction: async function() { return "mock-tx-signature"; },
  },
  "@solana/spl-token": {
    createMint: mockCreateMint,
    getOrCreateAssociatedTokenAccount: async function() {
      return { address: new MockPublicKey() };
    },
  },
};

/* ── Console mock ────────────────────────────────────────────────────── */

function makeMockConsole() {
  var logs = [];
  var fmt = function(a) { return typeof a === "object" ? JSON.stringify(a) : String(a); };
  return {
    logs: logs,
    mock: {
      log:   function() { var a=[]; for(var i=0;i<arguments.length;i++) a.push(fmt(arguments[i])); logs.push(a.join(" ")); },
      error: function() { var a=[]; for(var i=0;i<arguments.length;i++) a.push(fmt(arguments[i])); logs.push("[error] "+a.join(" ")); },
      warn:  function() { var a=[]; for(var i=0;i<arguments.length;i++) a.push(fmt(arguments[i])); logs.push("[warn] "+a.join(" ")); },
      info:  function() { var a=[]; for(var i=0;i<arguments.length;i++) a.push(fmt(arguments[i])); logs.push(a.join(" ")); },
    },
  };
}

/* ── Message handler ─────────────────────────────────────────────────── */

self.onmessage = async function(e) {
  var code = e.data.code;
  var mc = makeMockConsole();
  try {
    var fn = new Function("__mockConsole__", "__modules__", code);
    var result = await fn(mc.mock, __modules__);
    self.postMessage({ result: result, output: mc.logs.join("\\n") });
  } catch (err) {
    self.postMessage({ error: (err && err.message) || String(err), output: mc.logs.join("\\n") });
  }
};
`;

/** Lazily-created Blob URL for the sandbox worker. */
let workerBlobUrl: string | null = null;

function getWorkerBlobUrl(): string {
  if (!workerBlobUrl) {
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    workerBlobUrl = URL.createObjectURL(blob);
  }
  return workerBlobUrl;
}

/** Max execution time (ms) before we terminate the worker. */
const EXEC_TIMEOUT_MS = 5_000;

/**
 * Run a wrapped code string inside a disposable Web Worker.
 * The worker is terminated on timeout OR after the result arrives.
 */
function runInWorker(
  wrappedCode: string,
  timeoutMs: number = EXEC_TIMEOUT_MS
): Promise<{ result?: unknown; output: string; error?: string }> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(getWorkerBlobUrl());

    const timer = setTimeout(() => {
      worker.terminate();
      reject(
        new Error(
          `Execution timed out after ${timeoutMs / 1000}s — check for infinite loops`
        )
      );
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };

    worker.onerror = (e: ErrorEvent) => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error(e.message));
    };

    worker.postMessage({ code: wrappedCode });
  });
}

// ---------------------------------------------------------------------------
// Import transformation — runs on the MAIN thread (needs sucrase).
// The result is plain JS that gets sent to the worker.
// ---------------------------------------------------------------------------

function transformImports(code: string): string {
  // F-46: Block dynamic import() syntax to prevent module loading bypass
  if (/import\s*\(/.test(code)) {
    throw new Error("Dynamic import() is not allowed in challenges");
  }

  let transformed = code;

  // import { X, Y } from 'module';
  transformed = transformed.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*;?/g,
    (_match, imports: string, mod: string) => {
      const names = imports
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      return `const { ${names.join(", ")} } = __modules__[${JSON.stringify(mod)}] || {};`;
    }
  );

  // import X from 'module';
  transformed = transformed.replace(
    /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]\s*;?/g,
    (_match, name: string, mod: string) => {
      return `const ${name} = (__modules__[${JSON.stringify(mod)}] || {}).default || __modules__[${JSON.stringify(mod)}] || {};`;
    }
  );

  // const { X } = require('module');
  transformed = transformed.replace(
    /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g,
    (_match, imports: string, mod: string) => {
      const names = imports
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      return `const { ${names.join(", ")} } = __modules__[${JSON.stringify(mod)}] || {};`;
    }
  );

  // Strip all TypeScript syntax via sucrase
  try {
    const result = sucraseTransform(transformed, {
      transforms: ["typescript"],
      disableESTransforms: true,
    });
    transformed = result.code;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Syntax error: ${message}`);
  }

  return transformed;
}

// ---------------------------------------------------------------------------
// Code analysis helpers — run on the main thread
// ---------------------------------------------------------------------------

function detectFunctionName(code: string): string | null {
  const fnMatch = code.match(
    /(?:function\s+(\w+)\s*\(|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()/
  );
  return fnMatch ? (fnMatch[1] ?? fnMatch[2] ?? null) : null;
}

function functionHasParams(code: string, fnName: string): boolean {
  const re = new RegExp(
    `(?:function\\s+${fnName}\\s*\\(([^)]*?)\\)|(?:const|let|var)\\s+${fnName}\\s*=\\s*(?:async\\s*)?\\(([^)]*?)\\))`
  );
  const m = code.match(re);
  if (!m) return false;
  const params = (m[1] ?? m[2] ?? "").trim();
  return params.length > 0;
}

// Names that map to Keypair.generate() in buildArgSetup
const KEYPAIR_NAMES = new Set([
  "payer",
  "sender",
  "recipient",
  "owner",
  "authority",
  "mint",
  "senderKeypair",
  "recipientKeypair",
  "userKeypair",
]);
// Names that map to Keypair.generate().publicKey in buildArgSetup
const PUBKEY_NAMES = new Set([
  "programId",
  "userPubkey",
  "recipientPubkey",
  "senderPublicKey",
  "expectedOwner",
  "tokenProgramId",
  "systemProgramId",
  "dataAccount",
]);

function buildArgSetup(input: string): string {
  if (!input.trim()) return "";
  const args = input.split(",").map((a) => a.trim());
  const lines: string[] = [];
  for (const arg of args) {
    if (/^\d/.test(arg) || /^-?\d*\.?\d+$/.test(arg)) continue;
    if (/^['"]/.test(arg) || /^true$|^false$|^null$/.test(arg)) continue;
    if (arg === "connection")
      lines.push(
        `const ${arg} = new (__modules__["@solana/web3.js"].Connection)("https://api.devnet.solana.com");`
      );
    else if (KEYPAIR_NAMES.has(arg))
      lines.push(
        `const ${arg} = __modules__["@solana/web3.js"].Keypair.generate();`
      );
    else if (PUBKEY_NAMES.has(arg))
      lines.push(
        `const ${arg} = __modules__["@solana/web3.js"].Keypair.generate().publicKey;`
      );
    else if (arg === "wallets")
      lines.push(
        `const wallets = [__modules__["@solana/web3.js"].Keypair.generate().publicKey, __modules__["@solana/web3.js"].Keypair.generate().publicKey, __modules__["@solana/web3.js"].Keypair.generate().publicKey];`
      );
    else if (arg === "data" || arg === "buffer")
      lines.push(
        `const ${arg} = new Uint8Array([1, 5, 0, 0, 0, 6, 0, 0, 0, 83, 111, 108, 68, 101, 118]);`
      );
    else if (arg === "expectedSeeds")
      lines.push(`const expectedSeeds = [new TextEncoder().encode("user")];`);
    else if (arg === "account")
      lines.push(
        `const account = { owner: __modules__["@solana/web3.js"].Keypair.generate().publicKey, publicKey: __modules__["@solana/web3.js"].Keypair.generate().publicKey, lamports: 1000000, data: new Uint8Array([1,2,3]), executable: false };`
      );
    else if (arg === "position")
      lines.push(
        `const position = { collateral: 100, debt: 50, threshold: 1.5 };`
      );
    else lines.push(`const ${arg} = {};`);
  }
  return lines.join("\n");
}

function buildCallArgs(input: string): string {
  if (!input.trim()) return "";
  return input
    .split(",")
    .map((a) => {
      const t = a.trim();
      if (KEYPAIR_NAMES.has(t)) return `${t}.publicKey ?? ${t}`;
      return t;
    })
    .join(", ");
}

function isTypeShape(expected: string): Record<string, string> | null {
  const match = expected.match(/^\{\s*(.+)\s*\}$/);
  if (!match?.[1]) return null;
  const pairs: Record<string, string> = {};
  for (const part of match[1].split(",")) {
    const kv = part.split(":").map((s) => s.trim());
    const key = kv[0];
    const type = kv[1];
    if (
      kv.length === 2 &&
      key &&
      type &&
      /^(string|number|boolean|object)$/.test(type)
    ) {
      pairs[key] = type;
    } else {
      return null;
    }
  }
  return Object.keys(pairs).length > 0 ? pairs : null;
}

// ---------------------------------------------------------------------------
// Execution orchestrators — build code strings, send to Worker
// ---------------------------------------------------------------------------

async function captureConsoleOutput(
  code: string,
  firstTest?: TestCase
): Promise<{
  output: string;
  error?: string;
}> {
  const transformed = transformImports(code);
  const fnName = detectFunctionName(transformed);

  try {
    const hasParams = fnName && functionHasParams(transformed, fnName);

    let autoCall = "";
    if (fnName && !hasParams) {
      autoCall = `
const __res__ = await ${fnName}();
if (__res__ !== undefined) console.log(typeof __res__ === "object" ? JSON.stringify(__res__, null, 2) : __res__);`;
    } else if (fnName && hasParams && firstTest) {
      const argSetup = buildArgSetup(firstTest.input);
      const callArgs = firstTest.input.trim()
        ? buildCallArgs(firstTest.input)
        : "";
      autoCall = `
${argSetup}
const __res__ = await ${fnName}(${callArgs});
if (__res__ !== undefined) {
  console.log("Return value:");
  console.log(typeof __res__ === "object" ? JSON.stringify(__res__, null, 2) : __res__);
}`;
    }

    const wrappedCode = `
      return (async () => {
        "use strict";
        const console = __mockConsole__;
        ${transformed}
        ${autoCall}
      })();
    `;

    const { output, error } = await runInWorker(wrappedCode);
    return { output, error };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { output: "", error: message };
  }
}

async function runTestCase(
  code: string,
  testCase: TestCase
): Promise<TestResult> {
  const transformed = transformImports(code);
  const fnName = detectFunctionName(transformed);

  if (!fnName) {
    return {
      testCase,
      passed: false,
      actualOutput: "",
      error: "No function found in your code",
    };
  }

  try {
    const argSetup = buildArgSetup(testCase.input);
    const callArgs = testCase.input.trim() ? buildCallArgs(testCase.input) : "";

    const typeShape = isTypeShape(testCase.expectedOutput);

    let assertionCode: string;
    if (typeShape) {
      const checks = Object.entries(typeShape)
        .map(([key, type]) => `typeof __result__["${key}"] === "${type}"`)
        .join(" && ");
      assertionCode = `return (${checks}) ? "pass" : "fail: got " + JSON.stringify(__result__);`;
    } else {
      assertionCode = `
        const result = __result__;
        const transaction = __result__;
        if (typeof __result__ === "object" && __result__ !== null) {
          var publicKey = __result__.publicKey;
          var isValid = __result__.isValid;
          var lamports = __result__.instructions?.[0]?.lamports;
          var mintInfo = { decimals: 9 };
        }
        try {
          const __assertion__ = ${testCase.expectedOutput};
          if (typeof __assertion__ === "boolean") {
            return __assertion__ ? "pass" : "fail: assertion false";
          }
          if (typeof __assertion__ === "number" && isFinite(__assertion__)) {
            return "numeric:" + __assertion__;
          }
          return String(__assertion__);
        } catch(e) {
          const msg = e instanceof Error ? e.message : String(e);
          return "fail: " + msg;
        }
      `;
    }

    const wrappedCode = `
      return (async () => {
        "use strict";
        const console = __mockConsole__;
        ${transformed}
        ;
        ${argSetup}
        const __result__ = await ${fnName}(${callArgs});
        return (() => {
          ${assertionCode}
        })();
      })();
    `;

    const { result, error } = await runInWorker(wrappedCode);

    if (error) {
      return { testCase, passed: false, actualOutput: "", error };
    }

    const passed = result === "pass" || result === true;
    const actualOutput = passed ? "pass" : String(result);

    return { testCase, passed, actualOutput };
  } catch (err) {
    return {
      testCase,
      passed: false,
      actualOutput: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Rust execution — routes code through the /api/rust/execute proxy
// ---------------------------------------------------------------------------

const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, "");
}

function buildRustTestHarness(userCode: string, tests: TestCase[]): string {
  // Match top-level fn declarations (start of line, no indentation).
  // This skips methods inside impl blocks which are always indented.
  const topLevelFns = [...userCode.matchAll(/^fn\s+(\w+)\s*\(/gm)];
  const lastMatch = topLevelFns[topLevelFns.length - 1];
  const fnName = lastMatch?.[1] ?? null;

  if (!fnName || fnName === "main") {
    return userCode;
  }

  const testCalls = tests.map((tc, index) => {
    const args = tc.input.trim();
    const expected = tc.expectedOutput.trim();

    if (expected.includes("__result__")) {
      // Capture debug repr before the test expression, which may move __result__
      return `
    let __result__ = ${fnName}(${args});
    let __dbg__ = format!("{:?}", &__result__);
    if ${expected} {
        println!("TEST_${index}_PASS");
    } else {
        println!("TEST_${index}_FAIL: got {}", __dbg__);
    }`;
    }

    return `
    let __result__ = ${fnName}(${args});
    let __expected__ = ${expected};
    if __result__ == __expected__ {
        println!("TEST_${index}_PASS");
    } else {
        println!("TEST_${index}_FAIL: expected {:?}, got {:?}", __expected__, __result__);
    }`;
  });

  const codeWithoutMain = userCode.replace(
    /fn\s+main\s*\(\s*\)\s*\{[\s\S]*?\n\}/,
    ""
  );

  return `${codeWithoutMain}

fn main() {
${testCalls.join("\n")}
}`;
}

function parseRustTestResults(
  stdout: string,
  stderr: string,
  tests: TestCase[],
  success: boolean
): { testResults: TestResult[]; output: string; error?: string } {
  const cleanStdout = stripAnsi(stdout);
  const cleanStderr = stripAnsi(stderr);

  const testResults: TestResult[] = tests.map((tc, index) => {
    const passPattern = `TEST_${index}_PASS`;
    const failPattern = new RegExp(`TEST_${index}_FAIL:?\\s*(.*)`);

    if (cleanStdout.includes(passPattern)) {
      return { testCase: tc, passed: true, actualOutput: "pass" };
    }

    const failMatch = cleanStdout.match(failPattern);
    if (failMatch) {
      return {
        testCase: tc,
        passed: false,
        actualOutput: failMatch[1]?.trim() ?? "assertion failed",
      };
    }

    return {
      testCase: tc,
      passed: false,
      actualOutput: "",
      error: success ? "Test did not produce output" : "Compilation failed",
    };
  });

  const cleanOutput = cleanStdout
    .split("\n")
    .filter((line) => !line.match(/^TEST_\d+_(PASS|FAIL)/))
    .join("\n")
    .trim();

  return {
    testResults,
    output: cleanOutput,
    error: !success ? cleanStderr || "Compilation failed" : undefined,
  };
}

async function runRustChallenge(
  code: string,
  tests: TestCase[]
): Promise<ExecutionResult> {
  const harnessCode = buildRustTestHarness(code, tests);
  const result = await executeRustCode(harnessCode);

  const { testResults, output, error } = parseRustTestResults(
    result.stdout,
    result.stderr,
    tests,
    result.success
  );

  const displayError = result.error ?? error;

  return {
    success: testResults.every((r) => r.passed) && result.success,
    output,
    error: displayError,
    testResults,
  };
}

// ---------------------------------------------------------------------------
// Build Server execution — compiles Anchor/Solana programs via Cloud Run
// ---------------------------------------------------------------------------

async function runBuildChallenge(
  code: string,
  tests: TestCase[]
): Promise<ExecutionResult> {
  // Generate a program keypair BEFORE building so we can inject the correct
  // declare_id!() into the source. Anchor validates that the invoked program
  // address matches declare_id at runtime — without this, every deployment
  // fails with DeclaredProgramIdMismatch (error 4100).
  const programKeypair = Keypair.generate();
  const programId = programKeypair.publicKey.toBase58();

  // Replace any existing declare_id!("...") with the actual program pubkey.
  // The student's placeholder value doesn't matter — we always override it.
  const buildCode = code.replace(
    /declare_id!\s*\(\s*"[^"]*"\s*\)/,
    `declare_id!("${programId}")`
  );

  // The build server uses content-addressable caching (SHA256 of all files).
  // A nonce file busts the cache so we always get a fresh binary for deployment.
  // Without this, the cached UUID may point to a binary that was cleaned up by TTL.
  // The build server only accepts paths matching /src/<name>.rs
  const result = await buildProgram({
    files: [
      { path: "/src/lib.rs", content: buildCode },
      { path: "/src/_nonce.rs", content: `// ${crypto.randomUUID()}` },
    ],
  });

  // Cache the binary on the client side so deployProgram() can skip the
  // separate /api/deploy/:uuid HTTP fetch (which fails on Cloud Run routing misses).
  if (result.success && result.uuid && result.binaryB64) {
    try {
      const raw = atob(result.binaryB64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      setCachedBinary(result.uuid, bytes);
    } catch {
      // Non-critical — fetchBinary falls back to HTTP
    }
  }

  if (result.error) {
    return {
      success: false,
      output: "",
      error: result.error,
      testResults: tests.map((tc) => ({
        testCase: tc,
        passed: false,
        actualOutput: "",
        error: result.error,
      })),
    };
  }

  // Parse compiler stderr for warnings/errors
  const stderr = result.stderr ?? "";
  const hasErrors = !result.success;
  const cleanStderr = stderr.replace(/\x1b\[[0-9;]*m/g, "");

  // For build challenges, "tests" are compilation checks:
  // - Test 0 always checks: "Program compiles successfully"
  // - Additional tests check for absence of warnings, etc.
  const testResults: TestResult[] = tests.map((tc, index) => {
    if (index === 0) {
      // First test: compilation success
      return {
        testCase: tc,
        passed: result.success,
        actualOutput: result.success
          ? "Compilation successful"
          : cleanStderr.slice(0, 500),
      };
    }
    // Additional tests: pass if build succeeded (future: check for specific patterns)
    return {
      testCase: tc,
      passed: result.success,
      actualOutput: result.success ? "pass" : "Compilation failed",
    };
  });

  return {
    success: result.success && testResults.every((r) => r.passed),
    output: result.success
      ? `Program compiled successfully!\nBuild UUID: ${result.uuid}`
      : "",
    error: hasErrors ? cleanStderr : undefined,
    testResults,
    buildUuid: result.uuid,
    programKeypairSecret: Array.from(programKeypair.secretKey),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChallengeRunner({
  code,
  tests,
  language,
  buildType,
  isDeployable,
  onResult,
  onSubmit,
  isComplete,
  xpReward,
  solutionRevealed,
  className,
}: ChallengeRunnerProps) {
  const t = useTranslations("lesson");
  const [isRunning, setIsRunning] = useState(false);
  const [allPassed, setAllPassed] = useState(false);
  const [deployComplete, setDeployComplete] = useState(false);

  // Listen for deploy-complete events (deployable challenges only)
  useEffect(() => {
    if (!isDeployable) return;
    const handler = () => setDeployComplete(true);
    window.addEventListener("superteam:deploy-complete", handler);
    return () =>
      window.removeEventListener("superteam:deploy-complete", handler);
  }, [isDeployable]);

  const handleRun = useCallback(() => {
    setIsRunning(true);

    // Use setTimeout to allow UI to update before executing
    setTimeout(async () => {
      try {
        if (language === "rust" && buildType === "buildable") {
          // Build path: compile Anchor/Solana program via build server
          const result = await runBuildChallenge(code, tests);
          setAllPassed(result.success);
          onResult(result);

          // Notify deploy panel that a build completed successfully
          if (result.buildUuid) {
            window.dispatchEvent(
              new CustomEvent("superteam:build-complete", {
                detail: {
                  buildUuid: result.buildUuid,
                  programKeypairSecret: result.programKeypairSecret,
                },
              })
            );
          }
        } else if (language === "rust") {
          // Rust path: remote execution via proxy API
          const result = await runRustChallenge(code, tests);
          setAllPassed(result.success);
          onResult(result);
        } else {
          // JS/TS path: Web Worker sandbox (unchanged)
          const { output, error } = await captureConsoleOutput(code, tests[0]);
          const testResults: TestResult[] = await Promise.all(
            tests.map((tc) => runTestCase(code, tc))
          );
          const success = testResults.every((r) => r.passed);

          setAllPassed(success);

          onResult({
            success,
            output,
            error,
            testResults,
          });
        }
      } catch (err) {
        onResult({
          success: false,
          output: "",
          error: err instanceof Error ? err.message : String(err),
          testResults: [],
        });
      } finally {
        setIsRunning(false);
      }
    }, 50);
  }, [code, tests, language, buildType, onResult]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        onClick={handleRun}
        disabled={isRunning}
        size="sm"
        variant="push"
        className="gap-1.5"
      >
        {isRunning ? (
          <div
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          <Play size={14} weight="duotone" aria-hidden="true" />
        )}
        {buildType === "buildable" ? t("buildProgram") : t("runCode")}
      </Button>

      {allPassed && !isComplete && (!isDeployable || deployComplete) && (
        <Button
          onClick={onSubmit}
          size="sm"
          variant="pushSuccess"
          className="gap-1.5"
        >
          {t("submitSolution")}
          <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-bold">
            +{solutionRevealed ? Math.floor(xpReward * 0.5) : xpReward} XP
          </span>
        </Button>
      )}

      {isComplete && (
        <span className="text-sm font-medium text-success">
          {t("lessonComplete")}
        </span>
      )}
    </div>
  );
}
