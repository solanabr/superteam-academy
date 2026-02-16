// Sandboxed JavaScript Code Runner (Web Worker)
// Executes user code in an isolated context with captured console output.
// Imports are stripped; Connection, PublicKey, etc. are provided by the sandbox (no duplicate declarations).

self.onmessage = function (e) {
  const { code, testCases } = e.data;
  const logs = [];
  const errors = [];

  const fakeConsole = {
    log: (...args) => logs.push(args.map(stringify).join(' ')),
    error: (...args) => errors.push(args.map(stringify).join(' ')),
    warn: (...args) => logs.push('[warn] ' + args.map(stringify).join(' ')),
    info: (...args) => logs.push(args.map(stringify).join(' ')),
    dir: (...args) => logs.push(stringify(args[0])),
    table: (...args) => logs.push(stringify(args[0])),
  };

  function stringify(val) {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'object') {
      try { return JSON.stringify(val, null, 2); } catch { return String(val); }
    }
    return String(val);
  }

  class MockConnection {
    constructor(endpoint) { this.endpoint = endpoint; this.rpcEndpoint = endpoint; }
    async getBalance() { return 1500000000; }
    async getAccountInfo() { return { lamports: 1500000000, owner: 'system', data: [], executable: false }; }
    async getSlot() { return 285000000 + Math.floor(Math.random() * 1000); }
    async getVersion() { return { 'solana-core': '2.0.0' }; }
    async getBlockHeight() { return 240000000 + Math.floor(Math.random() * 1000); }
    async getLatestBlockhash() { return { blockhash: 'DEMO' + Math.random().toString(36).slice(2, 12), lastValidBlockHeight: 240000000 }; }
    async getMinimumBalanceForRentExemption(size) { return size * 6960 + 890880; }
    async getTokenAccountBalance() { return { value: { amount: '1000000', decimals: 6, uiAmount: 1.0 } }; }
    async confirmTransaction() { return { value: { err: null } }; }
    async sendTransaction() { return 'DEMO_TX_' + Math.random().toString(36).slice(2, 12); }
  }

  class MockPublicKey {
    constructor(key) { this._key = typeof key === 'string' ? key : 'Unknown'; }
    toBase58() { return this._key; }
    toString() { return this._key; }
    toBuffer() { return new Uint8Array(32); }
    equals(other) { return this._key === (other?._key || other); }
    static findProgramAddressSync(seeds, programId) {
      return [new MockPublicKey('PDA_' + Math.random().toString(36).slice(2, 10)), 255];
    }
    static createWithSeed(base, seed, programId) {
      return new MockPublicKey('SEED_' + seed);
    }
  }

  const mockKeypair = {
    generate: () => ({
      publicKey: new MockPublicKey('GEN' + Math.random().toString(36).slice(2, 10)),
      secretKey: new Uint8Array(64),
    }),
  };

  try {
    // Strip every form of import/export so user code never declares Connection etc.
    let processedCode = code
      // Multi-line: import { ... } from "..."
      .replace(/import\s*\{[\s\S]*?\}\s*from\s*["'][^"']*["']\s*;?\s*/g, '')
      // Single-line named import
      .replace(/import\s*\{[^}]*\}\s*from\s*["'][^"']*["']\s*;?/g, '')
      .replace(/import\s*\*\s*as\s+\w+\s*from\s*["'][^"']*["']\s*;?/g, '')
      .replace(/import\s+\w+\s*from\s*["'][^"']*["']\s*;?/g, '')
      .replace(/import\s*["'][^"']*["']\s*;?/g, '')
      .replace(/export\s*(default\s*)?/g, '');

    // Remove any leftover const/let/var Connection, PublicKey, etc. (safety net)
    const solanaIds = ['Connection', 'PublicKey', 'LAMPORTS_PER_SOL', 'Keypair', 'SystemProgram', 'Transaction'];
    solanaIds.forEach(function (id) {
      processedCode = processedCode.replace(
        new RegExp('\\b(const|let|var)\\s+' + id + '\\s*=[^;]*;?\\s*', 'g'),
        '/* ' + id + ' provided by sandbox */ '
      );
    });

    // Run user code in an IIFE; globals passed as params so only one declaration each.
    // Inner async so top-level await works.
    const wrappedCode = [
      '(function(__c, __Conn, __Pub, __Lamp, __Kp, __Sys, __Tx, __Buf, __Cluster, __Fetch) {',
      '  var console = __c;',
      '  var Connection = __Conn;',
      '  var PublicKey = __Pub;',
      '  var LAMPORTS_PER_SOL = __Lamp;',
      '  var Keypair = __Kp;',
      '  var SystemProgram = __Sys;',
      '  var Transaction = __Tx;',
      '  var Buffer = __Buf;',
      '  var clusterApiUrl = __Cluster;',
      '  var fetch = __Fetch;',
      '  return (async function() {',
      '  ' + processedCode,
      '  })();',
      '})(__console__, __Connection__, __PublicKey__, 1e9, __Keypair__, __SystemProgram__, __Transaction__, __Buffer__, __clusterApiUrl__, __fetch__);'
    ].join('\n');

    const __SystemProgram__ = {
      programId: { toBase58: function () { return '11111111111111111111111111111111'; } },
      transfer: function () { return { programId: '11111111111111111111111111111111', keys: [], data: new Uint8Array(0); }; }
    };
    const __Transaction__ = function () { this.instructions = []; this.feePayer = null; this.recentBlockhash = null; this.add = function (ix) { this.instructions.push(ix); return this; }; };
    const __Buffer__ = {
      from: function (v) { return new Uint8Array(typeof v === 'string' ? Array.from(v).map(function (c) { return c.charCodeAt(0); }) : v); },
      alloc: function (n) { return new Uint8Array(n); }
    };
    const __clusterApiUrl__ = function (c) { return 'https://api.' + (c || 'devnet') + '.solana.com'; };
    const __fetch__ = function () { return Promise.resolve({ json: function () { return Promise.resolve({}); }, text: function () { return Promise.resolve(''); } }); };

    const fn = new Function(
      '__console__', '__Connection__', '__PublicKey__', '__Keypair__',
      '__SystemProgram__', '__Transaction__', '__Buffer__', '__clusterApiUrl__', '__fetch__',
      'return (function(){ ' + wrappedCode + ' });'
    );

    let timedOut = false;
    const timer = setTimeout(function () { timedOut = true; }, 3000);

    const run = fn(
      fakeConsole, MockConnection, MockPublicKey, mockKeypair,
      __SystemProgram__, __Transaction__, __Buffer__, __clusterApiUrl__, __fetch__
    );
    const result = run();

    if (result && typeof result.then === 'function') {
      result
        .then(() => {
          clearTimeout(timer);
          if (timedOut) {
            self.postMessage({ logs: ['Execution timed out (3s limit)'], errors: ['Timeout'], testResults: [] });
            return;
          }
          self.postMessage({ logs, errors, testResults: runTests(code, logs, testCases) });
        })
        .catch((err) => {
          clearTimeout(timer);
          errors.push(err.message || String(err));
          self.postMessage({ logs, errors, testResults: runTests(code, logs, testCases) });
        });
    } else {
      clearTimeout(timer);
      if (timedOut) {
        self.postMessage({ logs: ['Execution timed out (3s limit)'], errors: ['Timeout'], testResults: [] });
        return;
      }
      self.postMessage({ logs, errors, testResults: runTests(code, logs, testCases) });
    }
  } catch (err) {
    errors.push(err.message || String(err));
    self.postMessage({ logs, errors, testResults: runTests(code, logs, testCases) });
  }
};

function runTests(code, logs, testCases) {
  if (!testCases || testCases.length === 0) return [];

  const allOutput = logs.join('\n').toLowerCase();
  const codeLower = code.toLowerCase();

  return testCases.map((tc) => {
    const expected = (tc.expectedOutput || '').trim();

    if (!expected) {
      return { name: tc.name, passed: code.trim().length > 20 };
    }

    if (expected.startsWith('REGEX:')) {
      try {
        const regex = new RegExp(expected.slice(6), 'i');
        return { name: tc.name, passed: regex.test(code) || regex.test(allOutput) };
      } catch {
        return { name: tc.name, passed: false };
      }
    }

    const patterns = expected.split('|').map((p) => p.trim().toLowerCase());
    const allPresent = patterns.every(
      (p) => codeLower.includes(p) || allOutput.includes(p)
    );

    return { name: tc.name, passed: allPresent };
  });
}
