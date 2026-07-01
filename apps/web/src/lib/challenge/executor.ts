/**
 * Secure server-side executor for untrusted learner JavaScript/TypeScript.
 *
 * SECURITY BOUNDARY
 * -----------------
 * Learner code is arbitrary and hostile by assumption. Node's `vm` module,
 * `eval`, and `new Function` share the host realm and are NOT isolation
 * boundaries. This module runs submissions inside a **QuickJS** interpreter
 * compiled to WebAssembly (`quickjs-emscripten`). QuickJS is a separate JS
 * engine executing in the WASM sandbox — it shares no realm, heap, or globals
 * with the host. Because it is pure WASM (no native addon), it loads in any
 * Node/serverless runtime, including Vercel. The guarantees:
 *
 *   - Separate heap with a hard MEMORY LIMIT (`MEMORY_LIMIT_MB`), enforced by
 *     the QuickJS runtime. Allocation past the cap aborts execution.
 *   - A wall-clock TIMEOUT per evaluation (`EXEC_TIMEOUT_MS`) via an interrupt
 *     handler polled by the interpreter — infinite loops / busy-waits are killed.
 *   - No ambient host objects. `process`, `require`, `module`, Node's
 *     `globalThis` bindings, the filesystem, and the network do not exist inside
 *     the QuickJS context. We never expose a host function or object into it.
 *   - Only two values cross the boundary: a STRING of code goes in; a
 *     JSON-serialisable STRING result comes out (copied, never shared).
 *
 * The mock Solana SDK and console live ENTIRELY inside the sandbox, assembled
 * from source text, so the learner interacts only with sandbox-local objects.
 * A FRESH runtime + context is created per test case, so one submission cannot
 * carry state (or prototype/global poisoning) into another test.
 *
 * DEGRADE-CLOSED
 * --------------
 * If the WASM module cannot be instantiated (it always should, but as a hard
 * invariant), this module reports `available: false` and runs NOTHING. Callers
 * MUST treat an unavailable executor as a validation FAILURE (deny completion),
 * never as a pass. See `runJsSubmission`'s return contract.
 */

import type { AdminTestCase } from "@superteam-lms/types";
import {
  newQuickJSWASMModuleFromVariant,
  type QuickJSWASMModule,
  type QuickJSContext,
  type QuickJSHandle,
} from "quickjs-emscripten-core";
// Single-file variant: the WASM is embedded (base64) in the JS module, so there
// is no separate `.wasm` artifact to trace into the serverless bundle — it just
// works on Vercel. "sync" = synchronous host↔VM calls (JS-level Promises inside
// the VM are still driven via the job queue; see resolveToString).
import releaseSyncVariant from "@jitl/quickjs-singlefile-cjs-release-sync";

/** Hard heap cap for the sandbox. Enough for SDK mocks + small programs. */
const MEMORY_LIMIT_MB = 64;

/**
 * Wall-clock budget per evaluation, enforced INSIDE the sandbox via the QuickJS
 * interrupt handler (kills CPU-bound runaways like `while(true){}`). Mirrors the
 * browser worker's 5s.
 */
const EXEC_TIMEOUT_MS = 5_000;

/**
 * Host-side hard guard, slightly longer than EXEC_TIMEOUT_MS. The in-sandbox
 * interrupt cannot fire on a quiescent pending promise (e.g.
 * `await new Promise(() => {})`) because there is no CPU activity to preempt and
 * no timers/event-loop in the VM, so such a promise never settles. This guard
 * abandons the evaluation (the runtime is then disposed), preventing a hung
 * request. Defense-in-depth, not the primary boundary.
 */
const HOST_GUARD_MS = EXEC_TIMEOUT_MS + 1_000;

/** Marker rejection raised when the host guard trips. */
const HOST_GUARD = Symbol("host-guard");

/** Race a promise against a host wall-clock guard. */
function withHostGuard<T>(p: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const guard = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(HOST_GUARD), HOST_GUARD_MS);
  });
  return Promise.race([p, guard]).finally(() =>
    clearTimeout(timer)
  ) as Promise<T>;
}

/** Upper bound on submission size we are willing to compile/run. */
const MAX_CODE_BYTES = 100_000;

let quickJsPromise: Promise<QuickJSWASMModule | null> | undefined;

/**
 * Instantiate the QuickJS WASM module once, lazily. Returns null (never throws)
 * if instantiation fails so the caller can degrade closed.
 */
async function loadQuickJS(): Promise<QuickJSWASMModule | null> {
  if (quickJsPromise === undefined) {
    quickJsPromise = newQuickJSWASMModuleFromVariant(releaseSyncVariant).catch(
      () => null
    );
  }
  return quickJsPromise;
}

/** Result of running a single test case server-side. */
export interface ServerTestResult {
  /** The test's authored id (mirrors AdminTestCase.id). */
  id: string;
  hidden: boolean;
  passed: boolean;
  /** Short, non-sensitive diagnostic (never leaks the expected value verbatim). */
  detail: string;
}

/** Aggregate outcome of running a submission against every test. */
export type SubmissionRunResult =
  | {
      available: true;
      /** True only when EVERY test (visible + hidden) passed. */
      passed: boolean;
      results: ServerTestResult[];
    }
  | {
      /**
       * The secure executor could not run. Callers MUST treat this as a
       * non-pass and deny completion.
       */
      available: false;
      reason: "executor_unavailable";
    };

/** Whether the secure executor can run in this environment. */
export async function isExecutorAvailable(): Promise<boolean> {
  return (await loadQuickJS()) !== null;
}

/* ------------------------------------------------------------------------- */
/* In-isolate runtime source                                                 */
/* ------------------------------------------------------------------------- */

/**
 * Source text evaluated INSIDE the isolate to install the mock SDK + console
 * and expose a single `__runCase__(userCode, testJson)` entry point. This is a
 * faithful server port of the browser worker contract in
 * `components/editor/challenge-runner.tsx` (mock @solana/web3.js + spl-token,
 * mock console, arg-setup heuristics, type-shape + assertion evaluation), so a
 * submission that passes the visible tests in-browser is judged identically by
 * the server — the difference is solely that the SERVER also runs hidden tests
 * and is authoritative.
 *
 * NOTE: pure strings/functions only. No host references. `__runCase__` returns
 * a JSON string; the host parses the copied-out string.
 */
const ISOLATE_RUNTIME_SOURCE = String.raw`
"use strict";

/* Capture pristine intrinsics the HARNESS relies on BEFORE any user code runs.
 * User code shares this realm's globals and could reassign \`globalThis.Function\`
 * or \`JSON.stringify\` to force a "pass" — the harness must build the test
 * wrapper and serialise its verdict through these private references, never the
 * (potentially poisoned) live globals. Fresh-context-per-test isolates one
 * submission's taint from the next; these captures additionally keep a
 * submission from corrupting its OWN test's harness readout. */
var __Function__ = Function;
var __jsonStringify__ = JSON.stringify;
var __jsonParse__ = JSON.parse;

var BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function toBase58(bytes) {
  var result = "";
  for (var i = 0; i < bytes.length; i++) result += BASE58_ALPHABET[bytes[i] % 58];
  return result;
}
function randomBytes(n) {
  var buf = new Uint8Array(n);
  for (var i = 0; i < n; i++) buf[i] = (Math.random() * 256) | 0;
  return buf;
}

function MockPublicKey(value) {
  if (typeof value === "string") {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) throw new Error("Invalid public key input");
    this._bytes = new Uint8Array(32);
  } else {
    this._bytes = value || randomBytes(32);
  }
}
MockPublicKey.prototype.toBase58 = function () { return toBase58(this._bytes); };
MockPublicKey.prototype.toString = function () { return this.toBase58(); };
MockPublicKey.prototype.toJSON = function () { return this.toBase58(); };
MockPublicKey.prototype.toBytes = function () { return this._bytes; };
MockPublicKey.prototype.equals = function (other) {
  if (!other || !other._bytes) return false;
  return this.toBase58() === other.toBase58();
};
MockPublicKey.isOnCurve = function () { return true; };
MockPublicKey.findProgramAddressSync = function (seeds, programId) {
  void programId;
  var total = 1;
  for (var i = 0; i < seeds.length; i++) total += seeds[i].length;
  var combined = new Uint8Array(total);
  var offset = 0;
  for (var j = 0; j < seeds.length; j++) { combined.set(seeds[j], offset); offset += seeds[j].length; }
  combined[offset] = 254;
  var hash = new Uint8Array(32);
  for (var k = 0; k < 32; k++) hash[k] = (combined[k % combined.length] || 0) ^ 0x5a;
  return [new MockPublicKey(hash), 254];
};

function MockKeypair() {
  this.secretKey = randomBytes(64);
  this.publicKey = new MockPublicKey(this.secretKey.slice(32));
}
MockKeypair.generate = function () { return new MockKeypair(); };
MockKeypair.fromSecretKey = function (sk) {
  var kp = new MockKeypair();
  kp.secretKey = sk;
  kp.publicKey = new MockPublicKey(sk.slice(32));
  return kp;
};

function MockTransaction() { this.instructions = []; }
MockTransaction.prototype.add = function () {
  for (var i = 0; i < arguments.length; i++) this.instructions.push(arguments[i]);
  return this;
};

function MockConnection() {}
MockConnection.prototype.requestAirdrop = function () { return Promise.resolve("mock-airdrop-sig"); };
MockConnection.prototype.confirmTransaction = function () { return Promise.resolve(); };
MockConnection.prototype.getBalance = function () { return Promise.resolve(2000000000); };

var MockSystemProgram = {
  transfer: function (params) {
    var out = { programId: "11111111111111111111111111111111" };
    for (var key in params) if (Object.prototype.hasOwnProperty.call(params, key)) out[key] = params[key];
    return out;
  }
};

var LAMPORTS_PER_SOL = 1000000000;
function mockCreateMint() { return Promise.resolve(new MockPublicKey()); }

Object.freeze(MockPublicKey.prototype);
Object.freeze(MockKeypair.prototype);
Object.freeze(MockTransaction.prototype);
Object.freeze(MockConnection.prototype);

var __modules__ = {
  "@solana/web3.js": {
    Keypair: MockKeypair,
    PublicKey: MockPublicKey,
    Connection: MockConnection,
    Transaction: MockTransaction,
    SystemProgram: MockSystemProgram,
    LAMPORTS_PER_SOL: LAMPORTS_PER_SOL,
    sendAndConfirmTransaction: function () { return Promise.resolve("mock-tx-signature"); }
  },
  "@solana/spl-token": {
    createMint: mockCreateMint,
    getOrCreateAssociatedTokenAccount: function () { return Promise.resolve({ address: new MockPublicKey() }); }
  }
};

function makeMockConsole() {
  var logs = [];
  var fmt = function (a) { return typeof a === "object" ? JSON.stringify(a) : String(a); };
  function joiner(prefix) {
    return function () { var a = []; for (var i = 0; i < arguments.length; i++) a.push(fmt(arguments[i])); logs.push(prefix + a.join(" ")); };
  }
  return { logs: logs, mock: { log: joiner(""), error: joiner("[error] "), warn: joiner("[warn] "), info: joiner("") } };
}

/* ---- code analysis (ports of challenge-runner helpers) ------------------ */

function detectFunctionName(code) {
  var m = code.match(/(?:function\s+(\w+)\s*\(|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()/);
  return m ? (m[1] || m[2] || null) : null;
}
function functionHasParams(code, fnName) {
  var re = new RegExp("(?:function\\s+" + fnName + "\\s*\\(([^)]*?)\\)|(?:const|let|var)\\s+" + fnName + "\\s*=\\s*(?:async\\s*)?\\(([^)]*?)\\))");
  var m = code.match(re);
  if (!m) return false;
  var params = (m[1] || m[2] || "").trim();
  return params.length > 0;
}

var KEYPAIR_NAMES = { payer:1, sender:1, recipient:1, owner:1, authority:1, mint:1, senderKeypair:1, recipientKeypair:1, userKeypair:1 };
var PUBKEY_NAMES = { programId:1, userPubkey:1, recipientPubkey:1, senderPublicKey:1, expectedOwner:1, tokenProgramId:1, systemProgramId:1, dataAccount:1 };

function buildArgSetup(input) {
  if (!input.trim()) return "";
  var args = input.split(",").map(function (a) { return a.trim(); });
  var lines = [];
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    if (/^\d/.test(arg) || /^-?\d*\.?\d+$/.test(arg)) continue;
    if (/^['"]/.test(arg) || /^true$|^false$|^null$/.test(arg)) continue;
    if (arg === "connection") lines.push('var ' + arg + ' = new (__modules__["@solana/web3.js"].Connection)("https://api.devnet.solana.com");');
    else if (KEYPAIR_NAMES[arg]) lines.push('var ' + arg + ' = __modules__["@solana/web3.js"].Keypair.generate();');
    else if (PUBKEY_NAMES[arg]) lines.push('var ' + arg + ' = __modules__["@solana/web3.js"].Keypair.generate().publicKey;');
    else if (arg === "wallets") lines.push('var wallets = [__modules__["@solana/web3.js"].Keypair.generate().publicKey, __modules__["@solana/web3.js"].Keypair.generate().publicKey, __modules__["@solana/web3.js"].Keypair.generate().publicKey];');
    else if (arg === "data" || arg === "buffer") lines.push('var ' + arg + ' = new Uint8Array([1, 5, 0, 0, 0, 6, 0, 0, 0, 83, 111, 108, 68, 101, 118]);');
    else if (arg === "expectedSeeds") lines.push('var expectedSeeds = [new TextEncoder().encode("user")];');
    else if (arg === "account") lines.push('var account = { owner: __modules__["@solana/web3.js"].Keypair.generate().publicKey, publicKey: __modules__["@solana/web3.js"].Keypair.generate().publicKey, lamports: 1000000, data: new Uint8Array([1,2,3]), executable: false };');
    else if (arg === "position") lines.push('var position = { collateral: 100, debt: 50, threshold: 1.5 };');
    else lines.push('var ' + arg + ' = {};');
  }
  return lines.join("\n");
}
function buildCallArgs(input) {
  if (!input.trim()) return "";
  return input.split(",").map(function (a) {
    var t = a.trim();
    if (KEYPAIR_NAMES[t]) return t + ".publicKey ?? " + t;
    return t;
  }).join(", ");
}
function isTypeShape(expected) {
  var match = expected.match(/^\{\s*(.+)\s*\}$/);
  if (!match || !match[1]) return null;
  var pairs = {};
  var parts = match[1].split(",");
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split(":").map(function (s) { return s.trim(); });
    var key = kv[0]; var type = kv[1];
    if (kv.length === 2 && key && type && /^(string|number|boolean|object)$/.test(type)) pairs[key] = type;
    else return null;
  }
  return Object.keys(pairs).length > 0 ? pairs : null;
}

/* ---- single test-case runner -------------------------------------------- */
/* Mirrors runTestCase() in challenge-runner.tsx. Transpilation to plain JS is
 * done on the host (sucrase) before this runs, so userCode is already JS. */

function runCase(userCode, test) {
  var fnName = detectFunctionName(userCode);
  if (!fnName) return { ok: false, detail: "No function found in submission" };

  var argSetup = buildArgSetup(test.input);
  var callArgs = test.input.trim() ? buildCallArgs(test.input) : "";
  var typeShape = isTypeShape(test.expectedOutput);

  var assertionCode;
  if (typeShape) {
    var checks = [];
    for (var key in typeShape) if (Object.prototype.hasOwnProperty.call(typeShape, key)) {
      checks.push('typeof __result__["' + key + '"] === "' + typeShape[key] + '"');
    }
    assertionCode = 'return (' + checks.join(" && ") + ') ? "pass" : "fail: shape mismatch";';
  } else {
    assertionCode =
      'var result = __result__;\n' +
      'var transaction = __result__;\n' +
      'if (typeof __result__ === "object" && __result__ !== null) {\n' +
      '  var publicKey = __result__.publicKey;\n' +
      '  var isValid = __result__.isValid;\n' +
      '  var lamports = __result__.instructions && __result__.instructions[0] ? __result__.instructions[0].lamports : undefined;\n' +
      '  var mintInfo = { decimals: 9 };\n' +
      '}\n' +
      'try {\n' +
      '  var __assertion__ = (' + test.expectedOutput + ');\n' +
      '  if (typeof __assertion__ === "boolean") return __assertion__ ? "pass" : "fail: assertion false";\n' +
      '  if (typeof __assertion__ === "number" && isFinite(__assertion__)) return "numeric:" + __assertion__;\n' +
      '  return String(__assertion__);\n' +
      '} catch (e) { return "fail: " + ((e && e.message) || String(e)); }';
  }

  var mc = makeMockConsole();
  var body =
    '"use strict";\n' +
    'return (async function(){\n' +
    '  var console = __mc__;\n' +
    userCode + '\n;\n' +
    argSetup + '\n' +
    '  var __result__ = await ' + fnName + '(' + callArgs + ');\n' +
    '  return (function(){ ' + assertionCode + ' })();\n' +
    '})();';

  try {
    // Build the wrapper from the CAPTURED Function, so a submission that
    // reassigned globalThis.Function cannot substitute its own wrapper factory.
    var fn = new __Function__("__mc__", "__modules__", body);
    var p = fn(mc.mock, __modules__);
    return Promise.resolve(p).then(function (result) {
      var passed = result === "pass" || result === true;
      return { ok: passed, detail: passed ? "pass" : String(result).slice(0, 200) };
    }, function (err) {
      return { ok: false, detail: ((err && err.message) || String(err)).slice(0, 200) };
    });
  } catch (err) {
    return Promise.resolve({ ok: false, detail: ((err && err.message) || String(err)).slice(0, 200) });
  }
}

/* Entry point invoked by the host. Returns a JSON STRING (copied out). Uses the
 * captured JSON intrinsics so a submission that reassigned JSON.parse /
 * JSON.stringify can neither smuggle a forged input nor forge the verdict that
 * crosses the boundary. */
async function __runCase__(userCodeJson, testJson) {
  var userCode = __jsonParse__(userCodeJson);
  var test = __jsonParse__(testJson);
  var r = await runCase(userCode, test);
  return __jsonStringify__(r);
}
`;

/* ------------------------------------------------------------------------- */
/* Host-side transpilation (untrusted code never executes here)              */
/* ------------------------------------------------------------------------- */

/**
 * Transpile a TS/JS submission to plain JS and rewrite `import`/`require` of the
 * mocked SDK modules to `__modules__` lookups — the server port of
 * `transformImports()` in the browser runner. This runs sucrase (a parser/
 * code-generator) on the host: it parses text, it does NOT execute it.
 */
function transformImports(code: string): string {
  if (/import\s*\(/.test(code)) {
    throw new Error("Dynamic import() is not allowed in challenges");
  }

  let transformed = code
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*;?/g,
      (_m, imports: string, mod: string) => {
        const names = imports
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return `const { ${names.join(", ")} } = __modules__[${JSON.stringify(mod)}] || {};`;
      }
    )
    .replace(
      /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]\s*;?/g,
      (_m, name: string, mod: string) =>
        `const ${name} = (__modules__[${JSON.stringify(mod)}] || {}).default || __modules__[${JSON.stringify(mod)}] || {};`
    )
    .replace(
      /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g,
      (_m, imports: string, mod: string) => {
        const names = imports
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return `const { ${names.join(", ")} } = __modules__[${JSON.stringify(mod)}] || {};`;
      }
    );

  // Lazy require: sucrase is already a dependency used by the browser runner.
  // Parsing-only; it never runs the submission.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { transform } = require("sucrase") as typeof import("sucrase");
  try {
    transformed = transform(transformed, {
      transforms: ["typescript"],
      disableESTransforms: true,
    }).code;
  } catch (err) {
    throw new Error(
      `Syntax error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  return transformed;
}

/* ------------------------------------------------------------------------- */
/* Public API                                                                */
/* ------------------------------------------------------------------------- */

/**
 * Settle the VM-side Promise returned by `__runCase__` and copy its string
 * result out. QuickJS Promises advance only when their microtask queue is
 * pumped (`executePendingJobs`); we drain it, then await the host-side promise
 * `resolvePromise` bridges. A never-settling VM promise leaves the queue empty
 * and the awaited promise pending — the caller's host guard abandons it.
 */
async function resolveToString(
  ctx: QuickJSContext,
  promiseHandle: QuickJSHandle
): Promise<string> {
  const settledPromise = ctx.resolvePromise(promiseHandle);
  promiseHandle.dispose();
  for (;;) {
    const jobs = ctx.runtime.executePendingJobs();
    if (jobs.error) {
      jobs.error.dispose();
      break;
    }
    if (jobs.value === 0) break; // nothing left to run
  }
  const settled = await settledPromise;
  const valueHandle = ctx.unwrapResult(settled);
  const out = ctx.getString(valueHandle);
  valueHandle.dispose();
  return out;
}

/**
 * Run one test case in a FRESH QuickJS runtime + context. A new runtime per test
 * means a submission cannot carry state — or `globalThis.Function` / prototype /
 * `JSON` poisoning — from one test into another (including hidden ones); the
 * whole engine instance is discarded after. Memory cap + interrupt-based timeout
 * are set on the runtime; the host guard (caller) covers a quiescent hang.
 */
async function runOneCase(
  quickjs: QuickJSWASMModule,
  userCodeJson: string,
  testJson: string
): Promise<{ passed: boolean; detail: string }> {
  const runtime = quickjs.newRuntime();
  runtime.setMemoryLimit(MEMORY_LIMIT_MB * 1024 * 1024);
  const deadline = Date.now() + EXEC_TIMEOUT_MS;
  runtime.setInterruptHandler(() => Date.now() > deadline);
  const ctx = runtime.newContext();
  try {
    // Install the harness + mock SDK into this context.
    ctx.unwrapResult(ctx.evalCode(ISOLATE_RUNTIME_SOURCE)).dispose();
    // Both args are JSON string literals embedded in the source — no host
    // reference crosses the boundary.
    const expr = `__runCase__(${JSON.stringify(userCodeJson)}, ${JSON.stringify(testJson)})`;
    const promiseHandle = ctx.unwrapResult(ctx.evalCode(expr));
    const raw = await withHostGuard(resolveToString(ctx, promiseHandle));
    const parsed = JSON.parse(raw) as { ok: boolean; detail: string };
    return { passed: parsed.ok === true, detail: parsed.detail };
  } catch (err) {
    if (err === HOST_GUARD)
      return { passed: false, detail: "Execution timed out" };
    // Interrupt (timeout) / OOM / syntax error / VM throw all land here.
    return {
      passed: false,
      detail: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    };
  } finally {
    ctx.dispose();
    runtime.dispose();
  }
}

/**
 * Run a JS/TS submission against every supplied test.
 *
 * Contract: returns `{ available: false }` when the secure executor cannot run
 * — callers MUST deny completion in that case. When available, `passed` is true
 * only if EVERY test passed. Each test runs in its own fresh QuickJS instance
 * (see {@link runOneCase}), so one test cannot influence another.
 */
export async function runJsSubmission(
  code: string,
  tests: AdminTestCase[]
): Promise<SubmissionRunResult> {
  const quickjs = await loadQuickJS();
  if (!quickjs) return { available: false, reason: "executor_unavailable" };

  const failAll = (detail: string): SubmissionRunResult => ({
    available: true,
    passed: false,
    results: tests.map((t) => ({
      id: t.id,
      hidden: t.hidden === true,
      passed: false,
      detail,
    })),
  });

  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
    return failAll("Submission too large");
  }

  let transpiled: string;
  try {
    transpiled = transformImports(code);
  } catch (err) {
    // A submission that doesn't even parse fails every test.
    return failAll(
      (err instanceof Error ? err.message : String(err)).slice(0, 200)
    );
  }

  const userCodeJson = JSON.stringify(transpiled);
  const results: ServerTestResult[] = [];
  for (const test of tests) {
    const testJson = JSON.stringify({
      input: test.input ?? "",
      expectedOutput: test.expectedOutput ?? "",
    });
    const { passed, detail } = await runOneCase(
      quickjs,
      userCodeJson,
      testJson
    );
    results.push({
      id: test.id,
      hidden: test.hidden === true,
      passed,
      detail,
    });
  }

  return {
    available: true,
    passed: results.length > 0 && results.every((r) => r.passed),
    results,
  };
}
