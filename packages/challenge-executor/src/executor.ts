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
 *   - A wall-clock BUDGET per submission (`SUBMISSION_BUDGET_MS`) across all of
 *     its tests.
 *   - No ambient host objects. `process`, `require`, `module`, Node's
 *     `globalThis` bindings, the filesystem, and the network do not exist inside
 *     the QuickJS context. We never expose a host function or object into it.
 *   - Only strings cross the boundary, copied, never shared.
 *
 * Each test runs in TWO fresh runtimes, one after the other:
 *
 *   1. The submission runtime evaluates the learner's code as a strict global
 *      script, calls the entry point and encodes the result as a JSON snapshot.
 *      Nothing else leaves it, and it is disposed before step 2 starts.
 *   2. The assertion runtime has never seen learner code. It rebuilds the result
 *      from the snapshot and evaluates the test's assertion to reach the verdict.
 *
 * So a submission can only choose the DATA an assertion reads, never the code
 * that reads it. Step 2 treats the snapshot as untrusted text: it checks every
 * field against the format, builds nothing but plain data from it, and takes
 * fixture names from the test. A snapshot that doesn't fit fails the test.
 *
 * DEGRADE-CLOSED
 * --------------
 * If the WASM module cannot be instantiated (it always should, but as a hard
 * invariant), this module reports `available: false` and runs NOTHING. Callers
 * MUST treat an unavailable executor as a validation FAILURE (deny completion),
 * never as a pass. See `runJsSubmission`'s return contract.
 */

import {
  CONSOLE_FORMAT_SOURCE,
  type AdminTestCase,
} from "@superteam-lms/types";
import {
  newQuickJSWASMModuleFromVariant,
  Scope,
  type QuickJSWASMModule,
  type QuickJSContext,
  type QuickJSHandle,
  type QuickJSRuntime,
} from "quickjs-emscripten-core";
// Single-file variant: the WASM is embedded (base64) in the JS module, so there
// is no separate `.wasm` artifact to trace into the serverless bundle — it just
// works on Vercel. "sync" = synchronous host↔VM calls; VM Promises advance only
// when the host pumps the job queue (see settle).
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
 * Interpreter stack cap. Without one, deep recursion overflows the host's stack
 * from inside the WASM frames instead of raising a catchable error in the VM. At
 * this size ordinary recursion gets about 1,700 frames. Past it, recursion reaches
 * the host's limit first; runJsSubmission recovers from that, but the learner's
 * own try/catch no longer sees the error.
 */
const MAX_STACK_BYTES = 320 * 1024;

/** Most values a result snapshot may hold, counting every array element. */
const MAX_SNAPSHOT_VALUES = 1_000_000;

/** Longest result snapshot accepted, in characters. */
const MAX_SNAPSHOT_CHARS = 16 * 1024 * 1024;

/** Wall-clock budget for one submission across all its tests. */
const SUBMISSION_BUDGET_MS = 15_000;

/** Upper bound on submission size we are willing to compile/run. */
const MAX_CODE_BYTES = 100_000;

/** How many VM jobs run before the host looks at the clock again. */
const JOB_BATCH = 1_024;

/**
 * QuickJS eval flags: global script (0), JS_EVAL_FLAG_STRICT, JS_EVAL_FLAG_ASYNC.
 * A global script gives `return` no function to return from, so at the top level
 * it is a SyntaxError. The async flag still allows top-level await, and unlike a
 * module the script takes every declaration a function body would, such as two
 * functions with one name. quickjs-emscripten has no named option for the async
 * flag; the executor test suite covers top-level await.
 */
const SUBMISSION_EVAL_FLAGS = (1 << 3) | (1 << 7);

let quickJsPromise: Promise<QuickJSWASMModule | null> | undefined;

/**
 * Instantiate the QuickJS WASM module once, lazily. Returns null (never throws)
 * if instantiation fails so the caller can degrade closed. A run that breaks the
 * instance clears `quickJsPromise`, so a caller already waiting on the old one
 * loops round for its replacement.
 */
async function loadQuickJS(): Promise<QuickJSWASMModule | null> {
  for (;;) {
    quickJsPromise ??= newQuickJSWASMModuleFromVariant(
      releaseSyncVariant
    ).catch(() => null);
    const pending = quickJsPromise;
    const quickjs = await pending;
    if (pending === quickJsPromise) return quickjs;
  }
}

/** Result of running a single test case server-side. */
export interface ServerTestResult {
  /** The test's authored id (mirrors AdminTestCase.id). */
  id: string;
  hidden: boolean;
  passed: boolean;
  /** Short, non-sensitive diagnostic (never leaks the expected value verbatim). */
  detail: string;
  /** The test stopped at a resource limit (time, heap, stack), so it says nothing
   * about whether the answer was right. Never set on a passed test. */
  limit?: true;
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
 * The mock SDK, Web API polyfills and mock console both runtimes install. A
 * server port of the browser worker contract in
 * `components/editor/challenge-runner.tsx`, so a submission that passes the
 * visible tests in-browser is judged identically by the server. The difference
 * is solely that the SERVER also runs hidden tests and is authoritative.
 *
 * NOTE: pure strings/functions only, no host references. It lands inside the
 * IIFE of each runtime source below, so its names aren't globals.
 */
const SANDBOX_LIBRARY_SOURCE = String.raw`
/* The names a test's input binds. Numbers, strings and keywords bind nothing. */
function fixtureNames(input) {
  if (!input.trim()) return [];
  return input.split(",").map(function (a) { return a.trim(); }).filter(function (arg) {
    if (/^\d/.test(arg) || /^-?\d*\.?\d+$/.test(arg)) return false;
    if (/^['"]/.test(arg) || /^true$|^false$|^null$/.test(arg)) return false;
    return true;
  });
}

/* Web-API polyfills QuickJS lacks. TextEncoder/TextDecoder are WHATWG APIs, not
 * core ECMAScript — the browser worker has them, this engine does not. Solana
 * byte-parsing challenges (e.g. decoding a username out of account data) use
 * them routinely, so without these a CORRECT submission throws server-side
 * ("TextDecoder is not defined") while passing in the browser -> an
 * un-completable challenge. Pure-JS UTF-8, defined before any user code runs. */
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = function TextEncoder() {};
  globalThis.TextEncoder.prototype.encode = function (input) {
    var str = String(input === undefined ? "" : input);
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) {
        bytes.push(c);
      } else if (c < 0x800) {
        bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        var lo = str.charCodeAt(++i);
        var cp = 0x10000 + ((c & 0x3ff) << 10) + (lo & 0x3ff);
        bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
      } else {
        bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
    }
    return new Uint8Array(bytes);
  };
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = function TextDecoder() {};
  globalThis.TextDecoder.prototype.decode = function (input) {
    if (input === undefined || input === null) return "";
    var bytes = input instanceof Uint8Array ? input : new Uint8Array(input.buffer ? input.buffer : input);
    var out = "";
    for (var i = 0; i < bytes.length; ) {
      var c = bytes[i++];
      if (c < 0x80) {
        out += String.fromCharCode(c);
      } else if (c < 0xe0) {
        out += String.fromCharCode(((c & 0x1f) << 6) | (bytes[i++] & 0x3f));
      } else if (c < 0xf0) {
        out += String.fromCharCode(((c & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
      } else {
        var cp2 = ((c & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
        cp2 -= 0x10000;
        out += String.fromCharCode(0xd800 + (cp2 >> 10), 0xdc00 + (cp2 & 0x3ff));
      }
    }
    return out;
  };
}

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
/* CAT-21: the fabricated PublicKey.findProgramAddressSync / isOnCurve mock — a
 * web3.js-v1 shim whose findProgramAddressSync returned a hand-rolled hash with
 * the bump hardcoded to 254 (no curve check, no retry loop) and whose isOnCurve
 * always returned true — was RETIRED with the legacy web3.js-v1 exercises. It is
 * the JavaScript twin of the DefaultHasher PDA model the Rust syllabi delete,
 * and it is the documented root cause of the old keypair-challenge grading
 * isValid:true unconditionally. Grading is now pure functions over injected
 * fixtures (PB-1), so no live block imports these. They stay as LOUD stubs so a
 * future block reaching for them fails with an explicit message rather than an
 * "undefined is not a function" mystery. */
function __retiredPdaShim__(name) {
  return function () {
    /* Markers front-loaded so they survive the 200-char detail slice. */
    throw new Error(
      name + " is not available in the grading sandbox (CAT-21: the web3.js-v1 " +
      "PDA mock was retired; PB-1 grades challenges as pure functions over " +
      "injected fixtures)."
    );
  };
}
MockPublicKey.isOnCurve = __retiredPdaShim__("PublicKey.isOnCurve");
MockPublicKey.findProgramAddressSync = __retiredPdaShim__("PublicKey.findProgramAddressSync");

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

var modules = {
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

${CONSOLE_FORMAT_SOURCE}
function makeMockConsole() {
  var logs = [];
  var fmt = __formatLogArg__;
  function joiner(prefix) {
    return function () { var a = []; for (var i = 0; i < arguments.length; i++) a.push(fmt(arguments[i])); logs.push(prefix + a.join(" ")); };
  }
  return { logs: logs, mock: { log: joiner(""), error: joiner("[error] "), warn: joiner("[warn] "), info: joiner("") } };
}

`;

/**
 * Evaluated before any learner code in the submission runtime. Yields the
 * functions the host calls, and keeps them out of the global scope. Natives are
 * captured here so learner code that replaces them only affects its own realm.
 */
const SUBMISSION_RUNTIME_SOURCE = String.raw`
(function () {
"use strict";
${SANDBOX_LIBRARY_SOURCE}

var apply = Reflect.apply;
var ownKeys = Reflect.ownKeys;
var getDesc = Object.getOwnPropertyDescriptor;
var getProto = Object.getPrototypeOf;
var defineProp = Object.defineProperty;
var nullObject = Object.create.bind(Object, null);
var isArray = Array.isArray;
var arrayJoin = Array.prototype.join;
var stringify = JSON.stringify;
var StringCtor = String;
var FunctionCtor = Function;
var TypeErrorCtor = TypeError;
var RangeErrorCtor = RangeError;
var Uint8ArrayCtor = Uint8Array;

var MapCtor = Map;
var mapGet = Map.prototype.get;
var mapSet = Map.prototype.set;
var mapHas = Map.prototype.has;
var mapForEach = Map.prototype.forEach;
var setForEach = Set.prototype.forEach;
var dateTime = Date.prototype.getTime;
var regexpSource = getDesc(RegExp.prototype, "source").get;
var regexpFlags = getDesc(RegExp.prototype, "flags").get;
var numberValue = Number.prototype.valueOf;
var stringValue = String.prototype.valueOf;
var booleanValue = Boolean.prototype.valueOf;
var bigintString = BigInt.prototype.toString;
var symbolDescription = getDesc(Symbol.prototype, "description").get;
var typedProto = getProto(Uint8Array.prototype);
var typedTag = getDesc(typedProto, Symbol.toStringTag).get;
var typedBuffer = getDesc(typedProto, "buffer").get;
var typedOffset = getDesc(typedProto, "byteOffset").get;
var typedLength = getDesc(typedProto, "length").get;
var bufferLength = getDesc(ArrayBuffer.prototype, "byteLength").get;
var viewBuffer = getDesc(DataView.prototype, "buffer").get;
var viewOffset = getDesc(DataView.prototype, "byteOffset").get;
var viewLength = getDesc(DataView.prototype, "byteLength").get;
var regexpIndex = /^(?:0|[1-9][0-9]*)$/;
var regexpExec = RegExp.prototype.exec;
var objectProto = Object.prototype;
var errorProto = Error.prototype;
var regexpProto = RegExp.prototype;

var knownProtos = new MapCtor();
function knownProto(ctor) { apply(mapSet, knownProtos, [ctor.prototype, true]); }
[
  Object, Array, Map, Set, WeakMap, WeakSet, Date, RegExp, Function, Number, String, Boolean,
  Promise, Symbol, BigInt, ArrayBuffer, DataView, Error, TypeError, RangeError, SyntaxError,
  ReferenceError, EvalError, URIError, Int8Array, Uint8Array, Uint8ClampedArray, Int16Array,
  Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array,
  MockPublicKey, MockKeypair, MockTransaction, MockConnection
].forEach(knownProto);
apply(mapSet, knownProtos, [typedProto, true]);

var mockNames = new MapCtor();
apply(mapSet, mockNames, [MockPublicKey.prototype, "PublicKey"]);
apply(mapSet, mockNames, [MockKeypair.prototype, "Keypair"]);
apply(mapSet, mockNames, [MockTransaction.prototype, "Transaction"]);
apply(mapSet, mockNames, [MockConnection.prototype, "Connection"]);

/* ---- code analysis (ports of challenge-runner helpers) ------------------ */

/* Blank out comment TEXT before any code analysis. The detector below takes the
 * first declaration-shaped match, so prose could name the entry point: a
 * starter whose docblock read "keep it a plain top-level function declaration
 * (no export, no imports)" made the harness call declaration(...), and a
 * learner who wrote the reference solution but kept the comment scored 0/5 with
 * "'declaration' is not defined". String and template literals are copied
 * through untouched — a // inside a URL is not a comment. Each comment leaves a
 * space behind so it cannot glue two tokens together. The result is used ONLY
 * to read identifiers; the code that RUNS is always the original source. */
function stripComments(code) {
  var out = "";
  var i = 0;
  var n = code.length;
  while (i < n) {
    var c = code.charAt(i);
    if (c === "/" && code.charAt(i + 1) === "/") {
      while (i < n && code.charAt(i) !== "\n") i++;
      out += " ";
      continue;
    }
    if (c === "/" && code.charAt(i + 1) === "*") {
      i += 2;
      while (i < n && !(code.charAt(i) === "*" && code.charAt(i + 1) === "/")) i++;
      i += 2;
      out += " ";
      continue;
    }
    /* Quote openers. The third is the backtick, written as an escape because
     * this runtime source lives inside a String.raw template on the host,
     * where a literal backtick would end the template. */
    if (c === '"' || c === "'" || c === "\u0060") {
      out += c;
      i++;
      while (i < n) {
        var d = code.charAt(i);
        out += d;
        i++;
        if (d === "\\") { out += code.charAt(i); i++; continue; }
        if (d === c) break;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function detectFunctionName(code) {
  var m = stripComments(code).match(/(?:function\s+(\w+)\s*\(|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()/);
  return m ? (m[1] || m[2] || null) : null;
}

var KEYPAIR_NAMES = { payer:1, sender:1, recipient:1, owner:1, authority:1, mint:1, senderKeypair:1, recipientKeypair:1, userKeypair:1 };
var PUBKEY_NAMES = { programId:1, userPubkey:1, recipientPubkey:1, senderPublicKey:1, expectedOwner:1, tokenProgramId:1, systemProgramId:1, dataAccount:1 };


function buildArgSetup(names) {
  var lines = [];
  for (var i = 0; i < names.length; i++) {
    var arg = names[i];
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

/* ---- running a test ------------------------------------------------------ */

function publish(name, value) {
  defineProp(globalThis, name, { value: value, writable: true, configurable: true, enumerable: false });
}
publish("__modules__", modules);
publish("console", makeMockConsole().mock);

var callArgs = [];
var fixtures = [];

/* Builds the test's arguments and returns the entry point's name, or "" when the
 * submission declares none. Runs before learner code. Fixtures become globals as
 * well as arguments, so a function reading one as a free variable still works,
 * and a learner's own binding of the same name shadows it without a clash. */
function prepare(userCode, input) {
  var fnName = detectFunctionName(userCode);
  if (!fnName) return "";
  var names = fixtureNames(input);
  var make = new FunctionCtor(
    "__modules__",
    '"use strict";\n' + buildArgSetup(names) + "\nreturn [[" + buildCallArgs(input) + "], [" + names.join(", ") + "]];"
  );
  var made = make(modules);
  callArgs = made[0];
  fixtures = made[1];
  names.forEach(function (name, i) {
    try { publish(name, fixtures[i]); } catch (e) { /* e.g. a name the realm won't let go */ }
  });
  return fnName;
}

async function invoke(fn, fnName) {
  if (typeof fn !== "function") throw new TypeErrorCtor(fnName + " is not a function");
  return await apply(fn, undefined, callArgs);
}

function describe(err) {
  var message = err && err.message;
  return StringCtor(message || err);
}

/* ---- result snapshot ----------------------------------------------------- */
/* Encodes a value graph as JSON text, written out by hand so no toJSON is ever
 * consulted. A value is a JSON primitive or a tagged array:
 * [0, id] object, [1] undefined, [2, s] bigint, [3, s] non-finite number or -0,
 * [4, s] symbol, [5] array hole, [6, s] accessor that threw. Objects go in a
 * node table by id, so cycles and shared references survive. Getters run here,
 * in the submission's realm, and only their values travel. */

var MAX_VALUES = ${MAX_SNAPSHOT_VALUES};
var MAX_SNAPSHOT_CHARS = ${MAX_SNAPSHOT_CHARS};
var MAX_ARRAY_PROPS_LENGTH = 65536;

/* JSON text for the encoder's own tree, which only holds arrays, plain objects
 * with fixed keys, and primitives. */
function jsonText(x) {
  if (x === null) return "null";
  if (typeof x === "string") return stringify(x);
  if (typeof x !== "object") return "" + x;
  var parts = [];
  var i;
  if (isArray(x)) {
    for (i = 0; i < x.length; i++) parts[i] = jsonText(x[i]);
    return "[" + apply(arrayJoin, parts, [","]) + "]";
  }
  var keys = ownKeys(x);
  for (i = 0; i < keys.length; i++) parts[i] = stringify(keys[i]) + ":" + jsonText(x[keys[i]]);
  return "{" + apply(arrayJoin, parts, [","]) + "}";
}

function tryBrand(fn, value) {
  try { return { value: apply(fn, value, []) }; } catch (e) { return null; }
}
function hasProto(value, proto) {
  for (var p = getProto(value), depth = 0; p && depth < 64; p = getProto(p), depth++) {
    if (p === proto) return true;
  }
  return false;
}

function encode(result) {
  var ids = new MapCtor();
  var queue = [];
  var count = 0;

  function ref(v) {
    if (++count > MAX_VALUES) throw new RangeErrorCtor("Result too large");
    switch (typeof v) {
      case "string":
      case "boolean":
        return v;
      case "number":
        if (v !== v) return [3, "NaN"];
        if (v === Infinity) return [3, "Infinity"];
        if (v === -Infinity) return [3, "-Infinity"];
        if (v === 0 && 1 / v < 0) return [3, "-0"];
        return v;
      case "undefined":
        return [1];
      case "bigint":
        return [2, apply(bigintString, v, [])];
      case "symbol":
        return [4, apply(symbolDescription, v, []) || ""];
    }
    if (v === null) return null;
    var id = apply(mapGet, ids, [v]);
    if (id === undefined) {
      id = queue.length;
      apply(mapSet, ids, [v, id]);
      queue[id] = v;
    }
    return [0, id];
  }

  function read(desc, receiver) {
    if (!desc.get && !desc.set) return ref(desc.value);
    if (!desc.get) return [1];
    try {
      return ref(apply(desc.get, receiver, []));
    } catch (e) {
      return [6, describe(e)];
    }
  }

  /* Own string-keyed properties: [key, value, enumerable]. Inherited members of a
   * non-builtin prototype (class methods, getters) are flattened onto the copy as
   * non-enumerable, which is how they already read: visible by name, absent from
   * Object.keys and JSON.stringify. */
  function props(v, skip) {
    var out = [];
    var seen = nullObject();
    function add(holder, inherited) {
      var keys = ownKeys(holder);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (typeof key !== "string" || seen[key] || (skip && skip(key))) continue;
        var desc = getDesc(holder, key);
        if (!desc) continue;
        seen[key] = true;
        out[out.length] = [key, read(desc, v), !inherited && !!desc.enumerable];
      }
    }
    add(v, false);
    var p = getProto(v);
    for (var depth = 0; p && depth < 64 && !apply(mapHas, knownProtos, [p]); depth++) {
      add(p, true);
      p = getProto(p);
    }
    return out;
  }

  function isIndex(key) { return apply(regexpExec, regexpIndex, [key]) !== null; }
  function skipIndices(key) { return key === "length" || isIndex(key); }
  function skipLastIndex(key) { return key === "lastIndex"; }
  function skipFunctionOwn(key) {
    return key === "length" || key === "name" || key === "prototype" || key === "caller" || key === "arguments";
  }

  function node(v) {
    if (typeof v === "function") {
      var nameDesc = getDesc(v, "name");
      var lengthDesc = getDesc(v, "length");
      return {
        k: "f",
        name: nameDesc && typeof nameDesc.value === "string" ? nameDesc.value : "",
        len: lengthDesc && lengthDesc.value >>> 0 === lengthDesc.value ? lengthDesc.value : 0,
        p: props(v, skipFunctionOwn)
      };
    }
    var proto = getProto(v);
    if (proto === objectProto) return { k: "o", p: props(v) };
    if (proto === null) return { k: "o", bare: 1, p: props(v) };
    if (isArray(v)) {
      var length = v.length;
      if (typeof length !== "number" || length > MAX_VALUES) throw new RangeErrorCtor("Result too large");
      var items = [];
      for (var i = 0; i < length; i++) {
        var itemDesc = getDesc(v, i);
        items[i] = itemDesc ? read(itemDesc, v) : [5];
      }
      return { k: "a", n: length, i: items, p: length < MAX_ARRAY_PROPS_LENGTH ? props(v, skipIndices) : [] };
    }
    var tag = apply(typedTag, v, []);
    if (tag) {
      return {
        k: "t",
        c: tag,
        b: ref(apply(typedBuffer, v, [])),
        o: apply(typedOffset, v, []),
        n: apply(typedLength, v, []),
        p: apply(typedLength, v, []) < MAX_ARRAY_PROPS_LENGTH ? props(v, skipIndices) : []
      };
    }
    var mockName = apply(mapGet, mockNames, [proto]);
    if (mockName) return { k: "k", c: mockName, p: props(v) };

    var brand;
    var entries = [];
    if ((brand = tryBrand(bufferLength, v))) {
      var bytes = new Uint8ArrayCtor(v);
      var data = [];
      for (var b = 0; b < bytes.length; b++) data[b] = bytes[b];
      count += bytes.length;
      if (count > MAX_VALUES) throw new RangeErrorCtor("Result too large");
      return { k: "b", d: data };
    }
    if ((brand = tryBrand(viewLength, v))) {
      return { k: "v", b: ref(apply(viewBuffer, v, [])), o: apply(viewOffset, v, []), n: brand.value };
    }
    if (tryBrand(function () { return apply(mapHas, this, [0]); }, v)) {
      apply(mapForEach, v, [function (value, key) { entries[entries.length] = [ref(key), ref(value)]; }]);
      return { k: "m", e: entries, p: props(v) };
    }
    var isSet = false;
    try { apply(setForEach, v, [function (value) { entries[entries.length] = ref(value); }]); isSet = true; } catch (e) { isSet = false; }
    if (isSet) return { k: "s", e: entries, p: props(v) };
    if ((brand = tryBrand(dateTime, v))) return { k: "d", t: ref(brand.value), p: props(v) };
    if (v !== regexpProto && (brand = tryBrand(regexpSource, v))) {
      return { k: "r", s: brand.value, f: apply(regexpFlags, v, []), li: v.lastIndex >>> 0 === v.lastIndex ? v.lastIndex : 0, p: props(v, skipLastIndex) };
    }
    if ((brand = tryBrand(numberValue, v)) || (brand = tryBrand(booleanValue, v))) return { k: "x", v: ref(brand.value), p: props(v) };
    if ((brand = tryBrand(stringValue, v))) return { k: "x", v: ref(brand.value), p: props(v, skipIndices) };
    if (hasProto(v, errorProto)) {
      var ctorDesc = getDesc(proto, "name");
      return { k: "e", c: ctorDesc && typeof ctorDesc.value === "string" ? ctorDesc.value : "Error", p: props(v) };
    }
    return { k: "o", p: props(v) };
  }

  var root = ref(result);
  var named = [];
  for (var f = 0; f < fixtures.length; f++) named[f] = ref(fixtures[f]);

  var nodes = [];
  for (var n = 0; n < queue.length; n++) nodes[n] = node(queue[n]);
  var snapshot = jsonText({ root: root, fixtures: named, nodes: nodes });
  if (snapshot.length > MAX_SNAPSHOT_CHARS) throw new RangeErrorCtor("Result too large");
  return snapshot;
}

return { prepare: prepare, invoke: invoke, encode: encode, describe: describe };
})()
`;

/**
 * Evaluated in the assertion runtime, which never holds learner code. Rebuilds a
 * snapshot and evaluates one test's assertion over it.
 */
const ASSERTION_RUNTIME_SOURCE = String.raw`
(function () {
"use strict";
${SANDBOX_LIBRARY_SOURCE}

var MOCKS = { PublicKey: MockPublicKey, Keypair: MockKeypair, Transaction: MockTransaction, Connection: MockConnection };
var SDK_GLOBALS = ["Keypair", "PublicKey", "Connection", "Transaction", "SystemProgram", "LAMPORTS_PER_SOL"];
SDK_GLOBALS.forEach(function (name) {
  Object.defineProperty(globalThis, name, { value: modules["@solana/web3.js"][name], writable: true, configurable: true });
});

var TYPED = { Int8Array: Int8Array, Uint8Array: Uint8Array, Uint8ClampedArray: Uint8ClampedArray, Int16Array: Int16Array, Uint16Array: Uint16Array, Int32Array: Int32Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array, BigInt64Array: BigInt64Array, BigUint64Array: BigUint64Array };
var ERRORS = { Error: Error, TypeError: TypeError, RangeError: RangeError, SyntaxError: SyntaxError, ReferenceError: ReferenceError, EvalError: EvalError, URIError: URIError };
var SPECIAL_NUMBERS = { "NaN": NaN, "Infinity": Infinity, "-Infinity": -Infinity, "-0": -0 };
var MAX_VALUES = ${MAX_SNAPSHOT_VALUES};
/* Longer than any bigint QuickJS can hold; parsing one is a native loop. */
var MAX_BIGINT_CHARS = 400000;
var MAX_LENGTH_FIELD = 4294967295;

function unreadable() { throw new TypeError("Unreadable result"); }
function owned(table, key) {
  if (typeof key !== "string" || !Object.prototype.hasOwnProperty.call(table, key)) unreadable();
  return table[key];
}
function isOffset(x, limit) { return Number.isInteger(x) && x >= 0 && x < limit; }
function list(x) { return Array.isArray(x) ? x : unreadable(); }
function text(x) { return typeof x === "string" ? x : unreadable(); }
function isHole(r) { return Array.isArray(r) && r[0] === 5; }
function isThrowing(r) { return Array.isArray(r) && r[0] === 6; }

/* Rebuilds the value graph from the snapshot, which is untrusted text. Every
 * field is checked and whatever doesn't fit fails the test, so the outcome can
 * only be plain data: an id reaches the node table and nothing else, a kind or
 * class comes from a table above, and no key or string is ever evaluated. */
function decode(snapshotJson) {
  var snap = JSON.parse(snapshotJson);
  if (snap === null || typeof snap !== "object" || Array.isArray(snap)) unreadable();
  var nodes = list(snap.nodes);
  var fixtures = list(snap.fixtures);
  if (nodes.length > MAX_VALUES) unreadable();
  var objects = [];

  function value(r) {
    if (r === null || typeof r !== "object") return r;
    if (!Array.isArray(r)) unreadable();
    switch (r[0]) {
      case 0:
        if (!isOffset(r[1], nodes.length)) unreadable();
        return objects[r[1]];
      case 1:
        return undefined;
      case 2:
        if (text(r[1]).length > MAX_BIGINT_CHARS || !/^-?[0-9]+$/.test(r[1])) unreadable();
        return BigInt(r[1]);
      case 3:
        return owned(SPECIAL_NUMBERS, r[1]);
      case 4:
        return Symbol(text(r[1]));
    }
    return unreadable();
  }
  function primitive(r, type) {
    var v = value(r);
    return typeof v === type ? v : unreadable();
  }
  function define(target, key, r, enumerable) {
    if (isThrowing(r)) {
      var message = text(r[1]);
      Object.defineProperty(target, key, { get: function () { throw new Error(message); }, enumerable: enumerable, configurable: true });
      return;
    }
    Object.defineProperty(target, key, { value: value(r), writable: true, enumerable: enumerable, configurable: true });
  }
  function bufferOf(r) {
    if (!Array.isArray(r) || r[0] !== 0 || !isOffset(r[1], nodes.length)) unreadable();
    var target = nodes[r[1]];
    if (target === null || typeof target !== "object" || target.k !== "b") unreadable();
    return objects[r[1]];
  }
  function shell(n) {
    switch (n.k) {
      case "o": return n.bare === 1 ? Object.create(null) : {};
      case "a":
        if (!isOffset(n.n, MAX_VALUES + 1) || list(n.i).length !== n.n) unreadable();
        return [];
      case "m": list(n.e); return new Map();
      case "s": list(n.e); return new Set();
      case "d": return new Date(primitive(n.t, "number"));
      case "r": {
        var re = new RegExp(text(n.s), text(n.f));
        if (!isOffset(n.li, MAX_LENGTH_FIELD)) unreadable();
        re.lastIndex = n.li;
        return re;
      }
      case "x": {
        var boxed = value(n.v);
        if (typeof boxed !== "number" && typeof boxed !== "string" && typeof boxed !== "boolean") unreadable();
        return Object(boxed);
      }
      case "e": return new (Object.prototype.hasOwnProperty.call(ERRORS, text(n.c)) ? ERRORS[n.c] : Error)();
      case "k": return Object.create(owned(MOCKS, n.c).prototype);
      case "f": {
        if (!isOffset(n.len, MAX_LENGTH_FIELD)) unreadable();
        var f = function () { throw new Error("A function in a result can't be called while grading"); };
        Object.defineProperty(f, "name", { value: text(n.name), configurable: true });
        Object.defineProperty(f, "length", { value: n.len, configurable: true });
        return f;
      }
      case "t": return new (owned(TYPED, n.c))(bufferOf(n.b), n.o, n.n);
      case "v": return new DataView(bufferOf(n.b), n.o, n.n);
    }
    return unreadable();
  }

  nodes.forEach(function (n) {
    if (n === null || typeof n !== "object" || Array.isArray(n)) unreadable();
  });
  /* Buffers first, since views are built on them, then everything else, then
   * contents, once every object a reference can name exists. Until then ids
   * resolve to undefined, and a kind that needs a primitive rejects it. */
  objects.length = nodes.length;
  nodes.forEach(function (n, id) {
    if (n.k !== "b") return;
    var d = list(n.d);
    var bytes = new Uint8Array(d.length);
    d.forEach(function (b, i) {
      if (!isOffset(b, 256)) unreadable();
      bytes[i] = b;
    });
    objects[id] = bytes.buffer;
  });
  nodes.forEach(function (n, id) {
    if (n.k !== "b") objects[id] = shell(n);
  });
  nodes.forEach(function (n, id) {
    var o = objects[id];
    if (n.k === "a") {
      n.i.forEach(function (r, i) {
        if (isHole(r)) return;
        if (isThrowing(r)) define(o, String(i), r, true);
        else o[i] = value(r);
      });
      o.length = n.n;
    } else if (n.k === "m") {
      n.e.forEach(function (e) {
        if (list(e).length !== 2) unreadable();
        o.set(value(e[0]), value(e[1]));
      });
    } else if (n.k === "s") {
      n.e.forEach(function (r) { o.add(value(r)); });
    }
    if (n.p === undefined) return;
    list(n.p).forEach(function (p) {
      var key = text(list(p)[0]);
      if (n.k === "a" && (key === "length" || /^[0-9]+$/.test(key))) unreadable();
      define(o, key, p[1], p[2] === true);
    });
  });

  return { root: value(snap.root), fixtures: fixtures.map(value) };
}

/* ---- assertions ---------------------------------------------------------- */

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


var RESERVED_PARAMS = ["__result__", "__modules__", "console"];
var IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/* Only a boolean true from the assertion passes a test. */
function evaluate(snapshotJson, testJson) {
  var outcome;
  try {
    var test = JSON.parse(testJson);
    var snap = decode(snapshotJson);
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
        '  return "fail: expected a boolean, got " + String(__assertion__);\n' +
        '} catch (e) { return "fail: " + ((e && e.message) || String(e)); }';
    }

    /* Parameter names come from the test, and the snapshot only fills them in,
     * by position. */
    var names = RESERVED_PARAMS.slice();
    var values = [snap.root, modules, makeMockConsole().mock];
    fixtureNames(test.input).forEach(function (name, i) {
      if (!IDENTIFIER.test(name)) unreadable();
      if (names.indexOf(name) !== -1) return;
      names.push(name);
      values.push(snap.fixtures[i]);
    });
    var body = '"use strict";\nreturn (function(){ ' + assertionCode + ' })();';
    var verdict = Function.apply(null, names.concat(body)).apply(undefined, values);
    outcome = verdict === "pass" ? { ok: true, detail: "pass" } : { ok: false, detail: String(verdict).slice(0, 200) };
  } catch (err) {
    outcome = { ok: false, detail: ((err && err.message) || String(err)).slice(0, 200) };
  }
  return JSON.stringify(outcome);
}

return evaluate;
})()
`;

/* ------------------------------------------------------------------------- */
/* Host-side transpilation (untrusted code never executes here)              */
/* ------------------------------------------------------------------------- */

/**
 * Transpile a TS/JS submission to plain JS and rewrite `import`/`require` of the
 * mocked SDK modules to `__modules__` lookups — the server port of
 * `transformImports()` in the browser runner. This runs sucrase (a parser/
 * code-generator) on the host: it parses text, it does NOT execute it. `export`
 * has no meaning in a script, so sucrase rewrites it onto a local `exports`.
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
  const hasExport = /\bexport\b/.test(transformed);
  try {
    transformed = transform(transformed, {
      transforms: hasExport ? ["typescript", "imports"] : ["typescript"],
      disableESTransforms: true,
    }).code;
  } catch (err) {
    throw new Error(
      `Syntax error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  return hasExport ? `var exports = {};\n${transformed}` : transformed;
}

/* ------------------------------------------------------------------------- */
/* Public API                                                                */
/* ------------------------------------------------------------------------- */

/** A test failed inside a runtime; `detail` is safe to report. */
class TestFailure extends Error {}

/** One test's outcome, before its id is attached. */
type TestOutcome = Pick<ServerTestResult, "passed" | "detail" | "limit">;

/** The failures that come from the sandbox's limits and not the answer. */
const LIMIT_DETAIL =
  /^(?:fail: )?(?:Execution timed out|interrupted|stack overflow|out of memory|Result too large)$/;

function failedOutcome(detail: string): TestOutcome {
  const short = detail.slice(0, 200);
  return LIMIT_DETAIL.test(short)
    ? { passed: false, detail: short, limit: true }
    : { passed: false, detail: short };
}

/** A fresh runtime with the heap cap and interrupt deadline, disposed after `fn`. */
function withRuntime<T>(
  quickjs: QuickJSWASMModule,
  deadline: number,
  fn: (ctx: QuickJSContext, runtime: QuickJSRuntime, scope: Scope) => T
): T {
  const runtime = quickjs.newRuntime();
  runtime.setMemoryLimit(MEMORY_LIMIT_MB * 1024 * 1024);
  runtime.setMaxStackSize(MAX_STACK_BYTES);
  runtime.setInterruptHandler(() => Date.now() > deadline);
  const ctx = runtime.newContext();
  try {
    return Scope.withScope((scope) => fn(ctx, runtime, scope));
  } finally {
    ctx.dispose();
    runtime.dispose();
  }
}

/** Dump a VM error handle without trusting it; never throws. */
function errorMessage(ctx: QuickJSContext, handle: QuickJSHandle): string {
  try {
    const dumped: unknown = ctx.dump(handle);
    if (dumped && typeof dumped === "object") {
      const { name, message } = dumped as { name?: unknown; message?: unknown };
      const text = typeof message === "string" ? message : "Submission failed";
      return name === "SyntaxError" ? `Syntax error: ${text}` : text;
    }
    return String(dumped);
  } catch {
    return "Submission failed";
  }
}

/** Unwrap a VM call, turning a thrown value into a TestFailure. */
function unwrapper(ctx: QuickJSContext, scope: Scope, deadline: number) {
  return (result: ReturnType<QuickJSContext["evalCode"]>): QuickJSHandle => {
    if (result.error) {
      const detail =
        Date.now() > deadline
          ? "Execution timed out"
          : errorMessage(ctx, result.error);
      result.error.dispose();
      throw new TestFailure(detail);
    }
    return scope.manage(result.value);
  };
}

/**
 * Pump the job queue until a VM promise settles and return its value handle
 * (owned by the caller), or throw a TestFailure. Nothing in the VM can wake a
 * promise but the queue, so pending with an empty queue means pending forever.
 */
function settle(
  ctx: QuickJSContext,
  runtime: QuickJSRuntime,
  promise: QuickJSHandle,
  deadline: number,
  describeRejection: (error: QuickJSHandle) => string
): QuickJSHandle {
  let idle = false;
  for (;;) {
    const state = ctx.getPromiseState(promise);
    if (state.type === "fulfilled") {
      return state.notAPromise ? promise.dup() : state.value;
    }
    if (state.type === "rejected") {
      const detail = describeRejection(state.error);
      state.error.dispose();
      throw new TestFailure(detail);
    }
    if (Date.now() > deadline) throw new TestFailure("Execution timed out");
    if (idle) throw new TestFailure("Submission never finished");
    const jobs = runtime.executePendingJobs(JOB_BATCH);
    if (jobs.error) {
      const detail =
        Date.now() > deadline
          ? "Execution timed out"
          : errorMessage(ctx, jobs.error);
      jobs.error.dispose();
      throw new TestFailure(detail);
    }
    if (jobs.value === 0) idle = true;
  }
}

/**
 * Step 1: run the entry point in a fresh runtime and return the result snapshot.
 * The runtime is gone by the time this returns.
 */
function runSubmission(
  quickjs: QuickJSWASMModule,
  code: string,
  input: string,
  deadline: number
): string {
  return withRuntime(quickjs, deadline, (ctx, runtime, scope) => {
    const unwrap = unwrapper(ctx, scope, deadline);

    const harness = unwrap(
      ctx.evalCode(SUBMISSION_RUNTIME_SOURCE, "runtime.js", { strict: true })
    );
    const prepare = scope.manage(ctx.getProp(harness, "prepare"));
    const invoke = scope.manage(ctx.getProp(harness, "invoke"));
    const encode = scope.manage(ctx.getProp(harness, "encode"));
    const describe = scope.manage(ctx.getProp(harness, "describe"));

    // Submission-thrown values go through the realm's own copy of String.
    const describeThrown = (error: QuickJSHandle): string => {
      if (Date.now() > deadline) return "Execution timed out";
      const described = ctx.callFunction(describe, ctx.undefined, error);
      if (described.error) {
        described.error.dispose();
        return errorMessage(ctx, error);
      }
      const text = ctx.getString(described.value);
      described.value.dispose();
      return text;
    };

    const name = ctx.getString(
      unwrap(
        ctx.callFunction(
          prepare,
          ctx.undefined,
          scope.manage(ctx.newString(code)),
          scope.manage(ctx.newString(input))
        )
      )
    );
    if (!name) throw new TestFailure("No function found in submission");

    const script = unwrap(
      ctx.evalCode(code, "submission.js", SUBMISSION_EVAL_FLAGS)
    );
    scope.manage(settle(ctx, runtime, script, deadline, describeThrown));

    const entry = unwrap(ctx.evalCode(name, "entry.js", { strict: true }));
    const pending = unwrap(
      ctx.callFunction(
        invoke,
        ctx.undefined,
        entry,
        scope.manage(ctx.newString(name))
      )
    );
    const result = scope.manage(
      settle(ctx, runtime, pending, deadline, describeThrown)
    );

    const snapshot = unwrap(ctx.callFunction(encode, ctx.undefined, result));
    if (ctx.typeof(snapshot) !== "string") {
      throw new TestFailure("Result could not be read");
    }
    const text = ctx.getString(snapshot);
    if (text.length > MAX_SNAPSHOT_CHARS) {
      throw new TestFailure("Result too large");
    }
    return text;
  });
}

/** Step 2: evaluate one assertion over a snapshot in a runtime with no learner code. */
function runAssertion(
  quickjs: QuickJSWASMModule,
  snapshot: string,
  testJson: string,
  deadline: number
): TestOutcome {
  return withRuntime(quickjs, deadline, (ctx, _runtime, scope) => {
    const unwrap = unwrapper(ctx, scope, deadline);
    const evaluate = unwrap(
      ctx.evalCode(ASSERTION_RUNTIME_SOURCE, "assertions.js", { strict: true })
    );
    const verdict = unwrap(
      ctx.callFunction(
        evaluate,
        ctx.undefined,
        scope.manage(ctx.newString(snapshot)),
        scope.manage(ctx.newString(testJson))
      )
    );
    const parsed = JSON.parse(ctx.getString(verdict)) as {
      ok: boolean;
      detail: string;
    };
    return parsed.ok === true
      ? { passed: true, detail: parsed.detail }
      : failedOutcome(parsed.detail);
  });
}

/**
 * Evaluate one assertion over a snapshot as step 2 of a run does. The snapshot is
 * whatever text step 1 produced, so the tests feed this directly.
 */
export async function judgeSnapshot(
  snapshot: string,
  test: Pick<AdminTestCase, "input" | "expectedOutput">
): Promise<TestOutcome> {
  const quickjs = await loadQuickJS();
  if (!quickjs) return { passed: false, detail: "executor_unavailable" };
  try {
    return judge(quickjs, snapshot, test, Date.now() + EXEC_TIMEOUT_MS);
  } catch (err) {
    if (err instanceof TestFailure) return failedOutcome(err.message);
    throw err;
  }
}

function judge(
  quickjs: QuickJSWASMModule,
  snapshot: string,
  test: Pick<AdminTestCase, "input" | "expectedOutput">,
  deadline: number
): TestOutcome {
  return runAssertion(
    quickjs,
    snapshot,
    JSON.stringify({
      input: test.input ?? "",
      expectedOutput: test.expectedOutput ?? "",
    }),
    deadline
  );
}

/**
 * Run one test case. Every wrong or failing submission comes back as a failed
 * test. Anything else that escapes means the WASM instance itself failed: native
 * recursion in a builtin can overflow the host's stack below the interpreter's
 * cap, which leaves the instance unusable. See runJsSubmission.
 */
function runOneCase(
  quickjs: QuickJSWASMModule,
  code: string,
  test: AdminTestCase,
  submissionDeadline: number
): TestOutcome {
  const testDeadline = () =>
    Math.min(Date.now() + EXEC_TIMEOUT_MS, submissionDeadline);
  try {
    const snapshot = runSubmission(
      quickjs,
      code,
      test.input ?? "",
      testDeadline()
    );
    return judge(quickjs, snapshot, test, testDeadline());
  } catch (err) {
    if (err instanceof TestFailure) return failedOutcome(err.message);
    throw err;
  }
}

/** Whether an instance can evaluate anything at all. */
function instanceWorks(quickjs: QuickJSWASMModule): boolean {
  try {
    return withRuntime(
      quickjs,
      Date.now() + EXEC_TIMEOUT_MS,
      (ctx, _runtime, scope) => {
        const value = unwrapper(ctx, scope, Infinity)(ctx.evalCode("1 + 1"));
        return ctx.getNumber(value) === 2;
      }
    );
  } catch {
    return false;
  }
}

/**
 * Run a JS/TS submission against every supplied test.
 *
 * Contract: returns `{ available: false }` when the secure executor cannot run
 * — callers MUST deny completion in that case. When available, `passed` is true
 * only if EVERY test passed. Each test runs in its own fresh QuickJS instances
 * (see {@link runOneCase}), so one test cannot influence another. Tests still
 * waiting when the budget runs out fail without running.
 */
export async function runJsSubmission(
  code: string,
  tests: AdminTestCase[]
): Promise<SubmissionRunResult> {
  let quickjs = await loadQuickJS();
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

  const submissionDeadline = Date.now() + SUBMISSION_BUDGET_MS;
  const results: ServerTestResult[] = [];
  for (const test of tests) {
    let outcome: TestOutcome = {
      passed: false,
      detail: "Execution budget exceeded",
      limit: true,
    };
    if (Date.now() < submissionDeadline) {
      try {
        outcome = runOneCase(quickjs, transpiled, test, submissionDeadline);
      } catch (err) {
        // Drop the instance. If a new one works, this test broke the old one and
        // it fails like any other. If not, nothing can be judged right now.
        console.error(
          "challenge executor instance failed:",
          err instanceof Error ? err.name : "unknown"
        );
        quickJsPromise = undefined;
        quickjs = await loadQuickJS();
        if (!quickjs || !instanceWorks(quickjs)) {
          quickJsPromise = undefined;
          return { available: false, reason: "executor_unavailable" };
        }
        outcome = {
          passed: false,
          detail: "Submission exceeded the sandbox's limits",
          limit: true,
        };
      }
    }
    results.push({ id: test.id, hidden: test.hidden === true, ...outcome });
  }

  return {
    available: true,
    passed: results.length > 0 && results.every((r) => r.passed),
    results,
  };
}
