/**
 * CJS module shim + Solana package polyfills injected into sandbox iframe.
 * Provides require(), Buffer, and lightweight @solana/web3.js + @solana/spl-token
 * so that exercise code with `import { Keypair } from '@solana/web3.js'` works
 * after esbuild transpiles it to CJS require() calls.
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
  Connection.prototype.getBalance = function() { return Promise.resolve(1000000000); };
  Connection.prototype.getAccountInfo = function() { return Promise.resolve(null); };

  function Transaction() { this.instructions = []; this.feePayer = null; this.recentBlockhash = null; }
  Transaction.prototype.add = function() {
    for (var i = 0; i < arguments.length; i++) this.instructions.push(arguments[i]);
    return this;
  };

  function TransactionInstruction(opts) { if (opts) Object.assign(this, opts); }

  var SystemProgram = {
    programId: new PublicKey(new Uint8Array(32)),
    transfer: function(opts) { return new TransactionInstruction(opts); },
    createAccount: function(opts) { return new TransactionInstruction(opts); },
    assign: function(opts) { return new TransactionInstruction(opts); },
  };

  function sendAndConfirmTransaction() {
    return Promise.resolve("sim_tx_" + Math.random().toString(36).slice(2));
  }

  function clusterApiUrl(cluster) {
    return "https://api." + (cluster || "devnet") + ".solana.com";
  }

  __modules["@solana/web3.js"] = {
    Keypair: Keypair,
    PublicKey: PublicKey,
    Connection: Connection,
    Transaction: Transaction,
    TransactionInstruction: TransactionInstruction,
    SystemProgram: SystemProgram,
    sendAndConfirmTransaction: sendAndConfirmTransaction,
    LAMPORTS_PER_SOL: 1000000000,
    clusterApiUrl: clusterApiUrl,
  };

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
})();
`;
