/* global self */
"use strict";

// ─── Minimal Solana mocks ──────────────────────────────────────────────────────
// Web3 symbols are NOT injected as globals or function parameters.
// Student/test code accesses them exclusively via:
//   const { PublicKey } = require("@solana/web3.js");
//
// Buffer is injected as a function parameter (not a web3 symbol) because test
// code uses it directly without importing it.
//
// Security note: student code runs in new Function() — it cannot access DOM,
// fetch, or IndexedDB. It CAN access globalThis and other Worker globals.
// This sandbox is suitable for educational use but is NOT a hardened sandbox.

function PublicKey(value) {
  if (value && typeof value.toBase58 === "function") {
    this._b58 = value.toBase58();
  } else {
    this._b58 = String(value);
  }
}
PublicKey.prototype.toBase58 = function () {
  return this._b58;
};
PublicKey.prototype.toBuffer = function () {
  return new Uint8Array(32);
};
PublicKey.prototype.toString = function () {
  return this._b58;
};
PublicKey.prototype.equals = function (other) {
  return this._b58 === (other && other._b58);
};
PublicKey.findProgramAddressSync = function () {
  return [new PublicKey("11111111111111111111111111111111"), 255];
};

var MockBuffer = {
  from: function (data) {
    if (typeof data === "string") {
      var enc = new TextEncoder().encode(data);
      return { length: enc.length, data: Array.from(enc) };
    }
    var arr = Array.isArray(data) ? data : Array.from(data || []);
    return { length: arr.length, data: arr };
  },
  alloc: function (size) {
    return { length: size, data: new Array(size).fill(0) };
  },
  concat: function (bufs) {
    var all = bufs.reduce(function (acc, b) {
      return acc.concat(b.data || []);
    }, []);
    return { length: all.length, data: all };
  },
};

function mockRequire(mod) {
  if (mod === "@solana/web3.js") {
    return {
      PublicKey: PublicKey,
      SystemProgram: {
        programId: new PublicKey("11111111111111111111111111111111"),
      },
      Connection: function () {},
      LAMPORTS_PER_SOL: 1000000000,
    };
  }
  throw new Error(
    'require("' + String(mod) + '") is not available in the test sandbox',
  );
}

// ─── Worker message handler ────────────────────────────────────────────────────

self.onmessage = function (evt) {
  var studentCode = String(evt.data.studentCode || "");
  var testCode = String(evt.data.testCode || "");
  var testResults = [];

  // Tracking assert — does NOT throw; collects all results.
  function assert(condition, name) {
    testResults.push({
      name: String(name || "assertion #" + (testResults.length + 1)),
      passed: Boolean(condition),
      error: condition
        ? undefined
        : "Expected truthy, got: " + String(condition),
    });
  }

  try {
    // studentCode + testCode run inside an isolated function scope.
    // Only `require`, `assert`, and `Buffer` are injected as parameters —
    // no web3 symbols. This prevents redeclaration errors when test code
    // does: const { PublicKey } = require("@solana/web3.js");
    var fn = new Function(
      "require",
      "assert",
      "Buffer",
      "fetch",
      "importScripts",
      "WebSocket",
      "XMLHttpRequest",
      "EventSource",
      "indexedDB",
      "caches",
      "globalThis",
      "self",
      '"use strict";\n' + studentCode + "\n" + testCode,
    );

    fn(
      mockRequire,
      assert,
      MockBuffer,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      Object.freeze({}),
      Object.freeze({}),
    );

    var allPassed =
      testResults.length > 0 &&
      testResults.every(function (r) {
        return r.passed;
      });

    self.postMessage({ passed: allPassed, results: testResults });
  } catch (err) {
    testResults.push({
      name: "Runtime error",
      passed: false,
      error: String(err && err.message ? err.message : err),
    });
    self.postMessage({ passed: false, results: testResults });
  }
};
