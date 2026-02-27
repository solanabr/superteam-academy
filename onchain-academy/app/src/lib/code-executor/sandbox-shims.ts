/**
 * CJS module shim + package polyfills injected into sandbox iframe.
 * Provides require(), Buffer, and lightweight stubs for:
 * - @solana/web3.js, @solana/spl-token
 * - react, react/jsx-runtime
 * - @coral-xyz/anchor
 * - chai
 * - @solana/wallet-adapter-react
 * - child_process
 * - react-native
 * - @solana-mobile/mobile-wallet-adapter-protocol-web3js
 * - @react-native-async-storage/async-storage
 * - bs58
 *
 * Also provides global test helpers (describe, it, before, etc.)
 * and a fetch stub for sandboxed iframes without network access.
 */
export const SANDBOX_SHIMS = `
var __modules = {};
var module = { exports: {} };
var exports = module.exports;
function require(mod) {
  if (__modules[mod]) return __modules[mod];
  throw new Error("Module '" + mod + "' is not available in sandbox. Available: " + Object.keys(__modules).join(", "));
}

if (typeof Buffer === "undefined") {
  var Buffer = {
    from: function(input) {
      if (typeof input === "string") return new TextEncoder().encode(input);
      if (input instanceof Uint8Array) return new Uint8Array(input);
      if (Array.isArray(input)) return new Uint8Array(input);
      return new Uint8Array(0);
    },
    alloc: function(size, fill) {
      var buf = new Uint8Array(size);
      if (typeof fill === "number") buf.fill(fill);
      return buf;
    },
    isBuffer: function(obj) { return obj instanceof Uint8Array; },
    concat: function(list) {
      var total = 0;
      for (var i = 0; i < list.length; i++) total += list[i].length;
      var result = new Uint8Array(total);
      var offset = 0;
      for (var j = 0; j < list.length; j++) { result.set(list[j], offset); offset += list[j].length; }
      return result;
    },
  };
}

// --- fetch stub (sandboxed iframes have null origin, most APIs reject) ---
(function() {
  var _mock = {
    ok: true, status: 200,
    json: function() { return Promise.resolve({ result: { items: [] }, jsonrpc: "2.0", requestId: "sim" }); },
    text: function() { return Promise.resolve("{}"); },
    headers: { get: function() { return "application/json"; } },
    clone: function() { return _mock; },
  };
  window.fetch = function() { return Promise.resolve(_mock); };
})();

// --- Mocha-style test globals ---
function describe(name, fn) {
  console.log(name);
  try { fn(); } catch(e) { console.error("describe error: " + String(e)); }
}
function it(name, fn) {
  console.log("  " + name);
  try {
    var r = fn();
    if (r && typeof r.then === "function") r.catch(function(){});
  } catch(e) { /* swallow */ }
}
function before(fn) { try { fn(); } catch(e) {} }
function beforeEach(fn) {}
function after(fn) {}
function afterEach(fn) {}

(function() {
  var ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  var AMAP = {};
  for (var z = 0; z < 58; z++) AMAP[ALPHA[z]] = z;

  function bs58Encode(src) {
    if (src.length === 0) return "";
    var zeroes = 0, len = 0, pb = 0, pe = src.length;
    while (pb !== pe && src[pb] === 0) { pb++; zeroes++; }
    var size = ((pe - pb) * 138 / 100 + 1) >>> 0;
    var b58 = new Uint8Array(size);
    while (pb !== pe) {
      var carry = src[pb];
      var i = 0;
      for (var it = size - 1; (carry !== 0 || i < len) && it !== -1; it--, i++) {
        carry += 256 * b58[it]; b58[it] = carry % 58; carry = (carry / 58) >>> 0;
      }
      len = i; pb++;
    }
    var it2 = size - len;
    while (it2 !== size && b58[it2] === 0) it2++;
    var str = "";
    for (var k = 0; k < zeroes; k++) str += "1";
    for (; it2 < size; it2++) str += ALPHA[b58[it2]];
    return str;
  }

  function bs58Decode(str) {
    if (str.length === 0) return new Uint8Array(0);
    var zeroes = 0, len = 0, psz = 0;
    while (psz < str.length && str[psz] === "1") { zeroes++; psz++; }
    var size = ((str.length - psz) * 733 / 1000 + 1) >>> 0;
    var b256 = new Uint8Array(size);
    while (psz < str.length) {
      var carry = AMAP[str[psz]];
      if (carry === undefined) throw new Error("Invalid base58 character: " + str[psz]);
      var i = 0;
      for (var it = size - 1; (carry !== 0 || i < len) && it !== -1; it--, i++) {
        carry += 58 * b256[it]; b256[it] = carry % 256; carry = (carry / 256) >>> 0;
      }
      len = i; psz++;
    }
    var it2 = size - len;
    while (it2 !== size && b256[it2] === 0) it2++;
    var result = new Uint8Array(zeroes + (size - it2));
    var ri = zeroes;
    while (it2 !== size) result[ri++] = b256[it2++];
    return result;
  }

  /* ============================
   *  @solana/web3.js
   * ============================ */

  function PublicKey(value) {
    if (value instanceof PublicKey) { this._bytes = new Uint8Array(value._bytes); }
    else if (value instanceof Uint8Array) { this._bytes = value.length >= 32 ? value.slice(0, 32) : value; }
    else if (typeof value === "string") { this._bytes = bs58Decode(value); }
    else if (Array.isArray(value)) { this._bytes = new Uint8Array(value); }
    else { this._bytes = new Uint8Array(32); }
  }
  PublicKey.prototype.toBase58 = function() { return bs58Encode(this._bytes); };
  PublicKey.prototype.toString = function() { return this.toBase58(); };
  PublicKey.prototype.toBytes = function() { return new Uint8Array(this._bytes); };
  PublicKey.prototype.toBuffer = function() { return new Uint8Array(this._bytes); };
  PublicKey.prototype.toJSON = function() { return this.toBase58(); };
  PublicKey.prototype.equals = function(o) {
    if (!o || !o._bytes) return false;
    for (var i = 0; i < 32; i++) if (this._bytes[i] !== o._bytes[i]) return false;
    return true;
  };
  PublicKey.default = new PublicKey(new Uint8Array(32));
  PublicKey.findProgramAddressSync = function(seeds, programId) {
    var hash = new Uint8Array(32);
    var off = 0;
    for (var s = 0; s < seeds.length; s++) {
      var seed = seeds[s];
      if (typeof seed === "string") seed = new TextEncoder().encode(seed);
      for (var b = 0; b < seed.length; b++) {
        hash[off % 32] = (hash[off % 32] ^ seed[b]) & 0xFF;
        off++;
      }
    }
    var pid = programId instanceof PublicKey ? programId._bytes : new Uint8Array(32);
    for (var p = 0; p < 32; p++) hash[p] = (hash[p] + pid[p] + 1) & 0xFF;
    return [new PublicKey(hash), 255];
  };
  PublicKey.createProgramAddressSync = PublicKey.findProgramAddressSync;

  function Keypair(secretKey) {
    if (secretKey) {
      this.secretKey = secretKey instanceof Uint8Array ? secretKey : new Uint8Array(secretKey);
    } else {
      this.secretKey = new Uint8Array(64);
      crypto.getRandomValues(this.secretKey);
    }
    this.publicKey = new PublicKey(this.secretKey.slice(32));
  }
  Keypair.generate = function() { return new Keypair(); };
  Keypair.fromSecretKey = function(sk) { return new Keypair(sk); };

  function Connection(endpoint, commitment) {
    this.rpcEndpoint = endpoint || "";
    this.commitment = typeof commitment === "string" ? commitment : (commitment && commitment.commitment) || "confirmed";
  }
  Connection.prototype.requestAirdrop = function() { return Promise.resolve("sim_airdrop_" + Math.random().toString(36).slice(2)); };
  Connection.prototype.confirmTransaction = function() { return Promise.resolve({ value: { err: null } }); };
  Connection.prototype.getLatestBlockhash = function() { return Promise.resolve({ blockhash: "sim_" + Math.random().toString(36).slice(2), lastValidBlockHeight: 999999 }); };
  Connection.prototype.sendTransaction = function() { return Promise.resolve("sim_tx_" + Math.random().toString(36).slice(2)); };
  Connection.prototype.sendRawTransaction = function() { return Promise.resolve("sim_raw_tx_" + Math.random().toString(36).slice(2)); };
  Connection.prototype.getBalance = function() { return Promise.resolve(1000000000); };
  Connection.prototype.getAccountInfo = function() { return Promise.resolve(null); };
  Connection.prototype.getMultipleAccountsInfo = function() { return Promise.resolve([]); };
  Connection.prototype.getParsedTokenAccountsByOwner = function() {
    return Promise.resolve({
      value: [{
        pubkey: new PublicKey(new Uint8Array(32)),
        account: { data: { parsed: { info: {
          mint: "SimMint1111111111111111111111111111111111111",
          tokenAmount: { uiAmount: 100, decimals: 9, amount: "100000000000" }
        }}}}
      }]
    });
  };
  Connection.prototype.getTokenAccountsByOwner = Connection.prototype.getParsedTokenAccountsByOwner;
  Connection.prototype.getSignatureStatuses = function() { return Promise.resolve({ value: [{ confirmationStatus: "confirmed", err: null }] }); };
  Connection.prototype.onAccountChange = function() { return 0; };
  Connection.prototype.removeAccountChangeListener = function() {};
  Connection.prototype.onLogs = function() { return 0; };
  Connection.prototype.onSignature = function(sig, cb) { if (cb) setTimeout(function(){ cb({ err: null }); }, 0); return 0; };

  function Transaction() { this.instructions = []; this.feePayer = null; this.recentBlockhash = null; this.signatures = []; }
  Transaction.prototype.add = function() {
    for (var i = 0; i < arguments.length; i++) this.instructions.push(arguments[i]);
    return this;
  };
  Transaction.prototype.sign = function() {};
  Transaction.prototype.serialize = function(opts) { return new Uint8Array(0); };
  Transaction.from = function() { return new Transaction(); };

  function TransactionInstruction(opts) { if (opts) Object.assign(this, opts); }

  function VersionedTransaction(msg) { this.message = msg || {}; this.signatures = []; }
  VersionedTransaction.deserialize = function() { return new VersionedTransaction({}); };
  VersionedTransaction.prototype.serialize = function() { return new Uint8Array(0); };

  function TransactionMessage(opts) { if (opts) Object.assign(this, opts); }
  TransactionMessage.prototype.compileToV0Message = function() { return {}; };
  TransactionMessage.decompile = function() { return new TransactionMessage({}); };

  var SystemProgram = {
    programId: new PublicKey(new Uint8Array(32)),
    transfer: function(opts) { return new TransactionInstruction(opts); },
    createAccount: function(opts) { return new TransactionInstruction(opts); },
    assign: function(opts) { return new TransactionInstruction(opts); },
    nonceInitialize: function(opts) { return new TransactionInstruction(opts); },
    nonceAdvance: function(opts) { return new TransactionInstruction(opts); },
  };

  var ComputeBudgetProgram = {
    setComputeUnitLimit: function(opts) { return new TransactionInstruction(opts); },
    setComputeUnitPrice: function(opts) { return new TransactionInstruction(opts); },
  };

  function sendAndConfirmTransaction() {
    return Promise.resolve("sim_tx_" + Math.random().toString(36).slice(2));
  }

  function clusterApiUrl(cluster) {
    return "https://api." + (cluster || "devnet") + ".solana.com";
  }

  function NonceAccount() {}
  NonceAccount.fromAccountData = function() { return { nonce: "sim_nonce_" + Math.random().toString(36).slice(2) }; };
  var NONCE_ACCOUNT_LENGTH = 80;

  __modules["@solana/web3.js"] = {
    Keypair: Keypair,
    PublicKey: PublicKey,
    Connection: Connection,
    Transaction: Transaction,
    TransactionInstruction: TransactionInstruction,
    VersionedTransaction: VersionedTransaction,
    TransactionMessage: TransactionMessage,
    SystemProgram: SystemProgram,
    ComputeBudgetProgram: ComputeBudgetProgram,
    sendAndConfirmTransaction: sendAndConfirmTransaction,
    LAMPORTS_PER_SOL: 1000000000,
    clusterApiUrl: clusterApiUrl,
    NonceAccount: NonceAccount,
    NONCE_ACCOUNT_LENGTH: NONCE_ACCOUNT_LENGTH,
  };

  /* ============================
   *  @solana/spl-token
   * ============================ */

  __modules["@solana/spl-token"] = {
    createMint: function() {
      var pk = new Uint8Array(32); crypto.getRandomValues(pk);
      return Promise.resolve(new PublicKey(pk));
    },
    getOrCreateAssociatedTokenAccount: function() {
      var pk = new Uint8Array(32); crypto.getRandomValues(pk);
      return Promise.resolve({ address: new PublicKey(pk), amount: 0 });
    },
    mintTo: function() { return Promise.resolve("sim_mint_tx"); },
    transfer: function() { return Promise.resolve("sim_transfer_tx"); },
    TOKEN_PROGRAM_ID: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    ASSOCIATED_TOKEN_PROGRAM_ID: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
  };

  /* ============================
   *  react
   * ============================ */

  var _react = {
    useState: function(init) { return [typeof init === "function" ? init() : init, function(){}]; },
    useEffect: function() {},
    useLayoutEffect: function() {},
    useCallback: function(fn) { return fn; },
    useMemo: function(fn) { return fn(); },
    useRef: function(init) { return { current: init !== undefined ? init : null }; },
    useReducer: function(reducer, init) { return [init, function(){}]; },
    createElement: function(type, props) {
      return { type: type, props: props || {}, children: Array.prototype.slice.call(arguments, 2) };
    },
    Fragment: "Fragment",
    memo: function(c) { return c; },
    forwardRef: function(fn) { return fn; },
    createContext: function(def) { return { Provider: function(){}, Consumer: function(){}, _default: def }; },
    useContext: function(ctx) { return ctx && ctx._default; },
    cloneElement: function(el) { return el; },
    isValidElement: function() { return true; },
    Children: { map: function(c, fn) { return Array.isArray(c) ? c.map(fn) : c ? [fn(c, 0)] : []; }, toArray: function(c) { return Array.isArray(c) ? c : c ? [c] : []; } },
  };
  _react.default = _react;
  __modules["react"] = _react;

  /* ============================
   *  react/jsx-runtime
   * ============================ */

  __modules["react/jsx-runtime"] = {
    jsx: function(type, props) { return { type: type, props: props }; },
    jsxs: function(type, props) { return { type: type, props: props }; },
    jsxDEV: function(type, props) { return { type: type, props: props }; },
    Fragment: "Fragment",
  };

  /* ============================
   *  BN (lightweight big-number)
   * ============================ */

  function BN(val) {
    if (val instanceof BN) { this.v = val.v; }
    else if (typeof val === "number") { this.v = val; }
    else if (typeof val === "string") { this.v = parseInt(val, 10) || 0; }
    else { this.v = 0; }
  }
  BN.prototype.toNumber = function() { return this.v; };
  BN.prototype.toString = function(base) { return this.v.toString(base || 10); };
  BN.prototype.add = function(o) { return new BN(this.v + (o instanceof BN ? o.v : Number(o))); };
  BN.prototype.sub = function(o) { return new BN(this.v - (o instanceof BN ? o.v : Number(o))); };
  BN.prototype.mul = function(o) { return new BN(this.v * (o instanceof BN ? o.v : Number(o))); };
  BN.prototype.div = function(o) { return new BN(Math.floor(this.v / (o instanceof BN ? o.v : Number(o)))); };
  BN.prototype.eq = function(o) { return this.v === (o instanceof BN ? o.v : Number(o)); };
  BN.prototype.gt = function(o) { return this.v > (o instanceof BN ? o.v : Number(o)); };
  BN.prototype.lt = function(o) { return this.v < (o instanceof BN ? o.v : Number(o)); };
  BN.prototype.isZero = function() { return this.v === 0; };
  BN.prototype.clone = function() { return new BN(this.v); };

  /* ============================
   *  @coral-xyz/anchor
   * ============================ */

  function _makeMethodChain() {
    var chain = {};
    var names = ["accounts", "signers", "remainingAccounts", "preInstructions", "postInstructions"];
    for (var i = 0; i < names.length; i++) {
      (function(n) { chain[n] = function() { return chain; }; })(names[i]);
    }
    chain.rpc = function() { return Promise.resolve("sim_tx"); };
    chain.transaction = function() { return Promise.resolve(new Transaction()); };
    chain.instruction = function() { return Promise.resolve(new TransactionInstruction({})); };
    return chain;
  }

  function _makeProgram() {
    return {
      methods: new Proxy({}, { get: function() { return function() { return _makeMethodChain(); }; } }),
      account: new Proxy({}, {
        get: function(t, name) {
          return {
            fetch: function() { return Promise.resolve({ count: new BN(0), authority: new PublicKey(new Uint8Array(32)), bump: 255 }); },
            fetchNullable: function() { return Promise.resolve(null); },
            all: function() { return Promise.resolve([]); },
          };
        }
      }),
      programId: new PublicKey(new Uint8Array(32)),
      addEventListener: function() { return 0; },
      removeEventListener: function() {},
    };
  }

  var _anchorProvider = {
    wallet: {
      publicKey: new PublicKey(new Uint8Array(32)),
      signTransaction: function(tx) { return Promise.resolve(tx); },
      signAllTransactions: function(txs) { return Promise.resolve(txs); },
    },
    connection: new Connection("https://api.devnet.solana.com"),
  };

  __modules["@coral-xyz/anchor"] = {
    AnchorProvider: {
      env: function() { return _anchorProvider; },
      local: function() { return _anchorProvider; },
    },
    setProvider: function() {},
    getProvider: function() { return _anchorProvider; },
    workspace: new Proxy({}, { get: function() { return _makeProgram(); } }),
    Program: function() { return _makeProgram(); },
    BN: BN,
    web3: null,
  };
  __modules["@coral-xyz/anchor"].web3 = __modules["@solana/web3.js"];

  /* ============================
   *  chai
   * ============================ */

  var _chaiProxy = new Proxy(function(){}, {
    get: function(t, p) {
      if (p === "fail") return function(msg) { throw new Error(msg || "Assertion failed"); };
      return _chaiProxy;
    },
    apply: function() { return _chaiProxy; }
  });
  __modules["chai"] = { expect: _chaiProxy, assert: _chaiProxy };

  /* ============================
   *  @solana/wallet-adapter-react
   * ============================ */

  __modules["@solana/wallet-adapter-react"] = {
    useWallet: function() {
      return {
        publicKey: new PublicKey(new Uint8Array(32)),
        connected: true, connecting: false, disconnecting: false,
        connect: function() { return Promise.resolve(); },
        disconnect: function() { return Promise.resolve(); },
        select: function() {},
        sendTransaction: function() { return Promise.resolve("sim_tx_" + Math.random().toString(36).slice(2)); },
        signTransaction: function(tx) { return Promise.resolve(tx); },
        signAllTransactions: function(txs) { return Promise.resolve(txs); },
        wallet: { adapter: { name: "Phantom" } },
        wallets: [{ adapter: { name: "Phantom" } }],
      };
    },
    useConnection: function() {
      return { connection: new Connection("https://api.devnet.solana.com") };
    },
    useAnchorWallet: function() { return _anchorProvider.wallet; },
  };

  /* ============================
   *  child_process
   * ============================ */

  __modules["child_process"] = {
    execSync: function(cmd, opts) {
      console.log("$ " + cmd);
      if (cmd.indexOf("solana balance") >= 0) return "5.0 SOL";
      if (cmd.indexOf("solana address") >= 0) return "SimProgram111111111111111111111111111111111";
      if (cmd.indexOf("solana config") >= 0) return "cluster configured";
      if (cmd.indexOf("anchor build") >= 0) return "build complete";
      if (cmd.indexOf("anchor deploy") >= 0) return "program deployed";
      return "";
    },
    exec: function(cmd, cb) { if (cb) cb(null, "", ""); },
  };

  /* ============================
   *  react-native
   * ============================ */

  function _rnStub(name) { return function(props) { return { type: name, props: props || {} }; }; }
  __modules["react-native"] = {
    View: _rnStub("View"),
    Text: _rnStub("Text"),
    TouchableOpacity: _rnStub("TouchableOpacity"),
    TextInput: _rnStub("TextInput"),
    FlatList: _rnStub("FlatList"),
    RefreshControl: _rnStub("RefreshControl"),
    Image: _rnStub("Image"),
    ScrollView: _rnStub("ScrollView"),
    Alert: { alert: function(t, m) { console.log("[Alert] " + t + (m ? ": " + m : "")); } },
    StyleSheet: { create: function(s) { return s; } },
    Platform: { OS: "ios", select: function(o) { return o.ios || o.default; } },
    Dimensions: { get: function() { return { width: 375, height: 812 }; } },
    AppState: { addEventListener: function() { return { remove: function(){} }; }, currentState: "active" },
  };

  /* ============================
   *  @solana-mobile/mobile-wallet-adapter-protocol-web3js
   * ============================ */

  __modules["@solana-mobile/mobile-wallet-adapter-protocol-web3js"] = {
    transact: function(callback) {
      var wallet = {
        authorize: function() {
          return Promise.resolve({
            accounts: [{ address: new Uint8Array(32) }],
            auth_token: "sim_auth_" + Math.random().toString(36).slice(2),
          });
        },
        reauthorize: function() { return Promise.resolve(); },
        deauthorize: function() { return Promise.resolve(); },
        signTransactions: function(opts) {
          return Promise.resolve((opts.transactions || []).map(function() { return new Uint8Array(0); }));
        },
        signMessages: function(opts) {
          return Promise.resolve((opts.payloads || []).map(function() { return new Uint8Array(64); }));
        },
        signAndSendTransactions: function(opts) {
          return Promise.resolve((opts.transactions || []).map(function() { return "sim_sig"; }));
        },
      };
      return callback(wallet);
    },
  };

  /* ============================
   *  @react-native-async-storage/async-storage
   * ============================ */

  var _asyncStore = {};
  var _asyncStorageObj = {
    getItem: function(k) { return Promise.resolve(_asyncStore[k] || null); },
    setItem: function(k, v) { _asyncStore[k] = v; return Promise.resolve(); },
    removeItem: function(k) { delete _asyncStore[k]; return Promise.resolve(); },
    clear: function() { _asyncStore = {}; return Promise.resolve(); },
    getAllKeys: function() { return Promise.resolve(Object.keys(_asyncStore)); },
  };
  _asyncStorageObj.default = _asyncStorageObj;
  __modules["@react-native-async-storage/async-storage"] = _asyncStorageObj;

  /* ============================
   *  bs58
   * ============================ */

  __modules["bs58"] = { encode: bs58Encode, decode: bs58Decode, default: { encode: bs58Encode, decode: bs58Decode } };
})();
`;
