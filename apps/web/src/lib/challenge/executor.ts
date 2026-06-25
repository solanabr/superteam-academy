/**
 * Secure server-side executor for untrusted learner JavaScript/TypeScript.
 *
 * SECURITY BOUNDARY
 * -----------------
 * Learner code is arbitrary and hostile by assumption. Node's `vm` module,
 * `eval`, and `new Function` share the host realm and are NOT isolation
 * boundaries. This module runs submissions inside a real V8 **isolate** via
 * `isolated-vm`, which is the standard primitive for sandboxing untrusted JS in
 * Node. The guarantees, all enforced by V8 itself (not by string filtering):
 *
 *   - Separate heap with a hard MEMORY LIMIT (`MEMORY_LIMIT_MB`). A submission
 *     that allocates past the cap is terminated; it cannot exhaust host memory.
 *   - A wall-clock TIMEOUT per evaluation (`EXEC_TIMEOUT_MS`). Infinite loops and
 *     busy-waits are killed.
 *   - No ambient host objects. `process`, `require`, `module`, `globalThis`
 *     bindings to Node, the filesystem, and the network simply do not exist in
 *     the isolate — there is nothing to reference. We never bridge a host
 *     function or object into the isolate (no `Reference`, no `jsonOver`...).
 *   - Only two values cross the boundary: a STRING of code goes in; a
 *     JSON-serialisable STRING result comes out (copied, never shared).
 *
 * The mock Solana SDK and console live ENTIRELY inside the isolate, assembled
 * from source text, so the learner interacts only with isolate-local objects.
 *
 * DEGRADE-CLOSED
 * --------------
 * `isolated-vm` is a native addon. If it cannot be loaded in the host
 * environment (e.g. a serverless platform without the prebuilt binary), this
 * module reports `available: false` and runs NOTHING. Callers MUST treat an
 * unavailable executor as a validation FAILURE (deny completion), never as a
 * pass. See `runJsSubmission`'s return contract. The intended production
 * fallback is a dedicated sandboxed microservice (mirroring the existing Rust
 * build-server), not an insecure in-process `vm`/`Function` shim.
 */

import type { AdminTestCase } from "@superteam-lms/types";

/** Hard heap cap for the isolate. Enough for SDK mocks + small programs. */
const MEMORY_LIMIT_MB = 64;

/**
 * Wall-clock budget per evaluation, enforced INSIDE the isolate (kills
 * CPU-bound runaways like `while(true){}`). Mirrors the browser worker's 5s.
 */
const EXEC_TIMEOUT_MS = 5_000;

/**
 * Host-side hard guard, slightly longer than EXEC_TIMEOUT_MS. The in-isolate
 * timeout cannot interrupt a quiescent pending promise (e.g.
 * `await new Promise(() => {})`) because there is no CPU activity to preempt —
 * there are no timers/event-loop primitives in the isolate, so such a promise
 * never settles. This guard abandons the evaluation and the isolate is disposed,
 * preventing a hung request. Defense-in-depth, not the primary boundary.
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

/**
 * Minimal shape of the `isolated-vm` API we depend on. Declared locally so the
 * module type-checks even where `@types` for the native addon are unavailable,
 * and so the dependency is imported lazily (degrade-closed).
 */
interface IvmContext {
  eval(
    code: string,
    opts?: { timeout?: number; promise?: boolean }
  ): Promise<unknown>;
  /**
   * Free this context's realm — its `global` and everything reachable from it
   * (including any taint a previous submission applied to `globalThis.Function`,
   * `Object.prototype`, etc.) — without disposing the whole isolate. A fresh
   * `createContext()` then yields a clean realm.
   */
  release(): void;
}
interface IvmIsolate {
  createContext(): Promise<IvmContext>;
  dispose(): void;
}
interface IvmModule {
  Isolate: new (opts: { memoryLimit: number }) => IvmIsolate;
}

let ivmModulePromise: Promise<IvmModule | null> | undefined;

/**
 * Load `isolated-vm` once, lazily. Returns null (never throws) when the native
 * addon is missing so the caller can degrade closed.
 */
async function loadIvm(): Promise<IvmModule | null> {
  if (ivmModulePromise === undefined) {
    ivmModulePromise = (async () => {
      try {
        // Indirected through a variable so bundlers don't try to follow/trace
        // the native addon at build time.
        const specifier = "isolated-vm";
        const mod = (await import(/* webpackIgnore: true */ specifier)) as
          | IvmModule
          | { default: IvmModule };
        return "Isolate" in mod ? mod : mod.default;
      } catch {
        return null;
      }
    })();
  }
  return ivmModulePromise;
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
  return (await loadIvm()) !== null;
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
 * Run a JS/TS submission against every supplied test.
 *
 * ISOLATION PER TEST CASE — each test runs in a FRESH context (realm) inside the
 * isolate: a new context is created, the runtime/harness is installed into it,
 * the submission + that single test run, the verdict is read out, and the
 * context is released. A submission cannot carry state from one test into
 * another, because the test wrapper is built in-isolate with `new Function(...)`
 * (which resolves to that realm's `globalThis.Function`) — running user code in
 * a shared global let test #1 reassign `globalThis.Function` (or pollute
 * `Object.prototype` / `Array.prototype` / `JSON`) and force every later test —
 * including hidden ones — to "pass". A clean realm per test, discarded after,
 * closes that bypass. CPU timeout, host wall-clock kill, and memory limit are
 * unchanged.
 *
 * Contract: returns `{ available: false }` when the secure executor cannot run
 * — callers MUST deny completion in that case. When available, `passed` is true
 * only if EVERY test passed.
 */
export async function runJsSubmission(
  code: string,
  tests: AdminTestCase[]
): Promise<SubmissionRunResult> {
  const ivm = await loadIvm();
  if (!ivm) return { available: false, reason: "executor_unavailable" };

  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
    return {
      available: true,
      passed: false,
      results: tests.map((t) => ({
        id: t.id,
        hidden: t.hidden === true,
        passed: false,
        detail: "Submission too large",
      })),
    };
  }

  let transpiled: string;
  try {
    transpiled = transformImports(code);
  } catch (err) {
    // A submission that doesn't even parse fails every test.
    const detail = (err instanceof Error ? err.message : String(err)).slice(
      0,
      200
    );
    return {
      available: true,
      passed: false,
      results: tests.map((t) => ({
        id: t.id,
        hidden: t.hidden === true,
        passed: false,
        detail,
      })),
    };
  }

  const isolate = new ivm.Isolate({ memoryLimit: MEMORY_LIMIT_MB });
  try {
    const userCodeJson = JSON.stringify(transpiled);
    const results: ServerTestResult[] = [];
    // The host wall-clock guard can only trip once: it abandons the in-flight
    // evaluation and we dispose the whole isolate, so any remaining tests cannot
    // run and are recorded as failed.
    let aborted = false;

    for (const test of tests) {
      if (aborted) {
        results.push({
          id: test.id,
          hidden: test.hidden === true,
          passed: false,
          detail: "Execution aborted (timeout)",
        });
        continue;
      }

      const testJson = JSON.stringify({
        input: test.input ?? "",
        expectedOutput: test.expectedOutput ?? "",
      });
      const expr = `__runCase__(${JSON.stringify(userCodeJson)}, ${JSON.stringify(testJson)})`;
      let detail = "execution error";
      let passed = false;

      // FRESH realm per test: create a new context, install the runtime into it,
      // run [user code + this one test], read the verdict, then release it. Any
      // taint the submission applied to this realm's `globalThis.Function`,
      // prototypes, etc. dies with the context and cannot reach the next test.
      let context: IvmContext | undefined;
      try {
        context = await isolate.createContext();
        await withHostGuard(
          context.eval(ISOLATE_RUNTIME_SOURCE, { timeout: EXEC_TIMEOUT_MS })
        );
        // promise:true resolves the async __runCase__ inside the isolate and
        // copies the resolved JSON string out. Both arguments are JSON string
        // literals embedded in the eval'd expression — no host references cross
        // the boundary. The in-isolate timeout kills CPU-bound runaways;
        // withHostGuard catches the rare quiescent never-settling promise.
        const raw = (await withHostGuard(
          context.eval(expr, {
            timeout: EXEC_TIMEOUT_MS,
            promise: true,
          })
        )) as string;
        const parsed = JSON.parse(raw) as { ok: boolean; detail: string };
        passed = parsed.ok === true;
        detail = parsed.detail;
      } catch (err) {
        if (err === HOST_GUARD) {
          // Abandon the hung evaluation: dispose the isolate and fail the rest.
          aborted = true;
          detail = "Execution timed out";
        } else {
          // In-isolate timeout / OOM / disposed all land here -> test fails.
          detail = (err instanceof Error ? err.message : String(err)).slice(
            0,
            200
          );
        }
        passed = false;
      } finally {
        // Free this test's realm. Skipped when the host guard tripped: the
        // isolate is about to be disposed wholesale and the context may be
        // mid-eval, so releasing it here is both unnecessary and unsafe.
        if (context && !aborted) {
          try {
            context.release();
          } catch {
            // A context that already died (e.g. in-isolate timeout/OOM) cannot
            // be released; nothing to clean up.
          }
        }
      }

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
  } finally {
    isolate.dispose();
  }
}
