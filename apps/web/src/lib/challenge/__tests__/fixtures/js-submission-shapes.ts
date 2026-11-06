import type { AdminTestCase } from "@superteam-lms/types";

/**
 * Correct submissions in the shapes learners write. Both graders (the server
 * executor and the browser runner) must pass every one of them.
 */
export interface SubmissionShape {
  name: string;
  code: string;
  tests: AdminTestCase[];
}

const t = (input: string, expectedOutput: string, id = "t"): AdminTestCase => ({
  id,
  description: "",
  input,
  expectedOutput,
});

const addTests = [
  t("2, 3", "result === 5", "a"),
  t("10, 20", "result === 30", "b"),
];

export const SUBMISSION_SHAPES: SubmissionShape[] = [
  {
    name: "a function",
    code: "function add(a, b) { return a + b; }",
    tests: addTests,
  },
  {
    name: "an async function",
    code: "async function add(a, b) { return a + b; }",
    tests: addTests,
  },
  {
    name: "an arrow function",
    code: "const add = (a, b) => a + b;",
    tests: addTests,
  },
  {
    name: "an async arrow",
    code: "const add = async (a, b) => a + b;",
    tests: addTests,
  },
  {
    name: "a let binding",
    code: "let add = (a, b) => { return a + b; };",
    tests: addTests,
  },
  {
    name: "a var binding",
    code: "var add = (a, b) => a + b;",
    tests: addTests,
  },
  {
    name: "a helper below the entry point",
    code: "function add(a, b) { return plus(a, b); }\nfunction plus(a, b) { return a + b; }",
    tests: addTests,
  },
  {
    name: "a helper arrow below the entry point",
    code: "function add(a, b) { return plus(a, b); }\nconst plus = (a, b) => a + b;",
    tests: addTests,
  },
  {
    name: "a class above the entry point",
    code: "class Calc { constructor() { this.base = 0; } add(a, b) { return this.base + a + b; } static of() { return new Calc(); } }\nfunction add(a, b) { return Calc.of().add(a, b); }",
    tests: addTests,
  },
  {
    name: "private class fields",
    code: "class Box { #v; constructor(v) { this.#v = v; } get v() { return this.#v; } }\nfunction add(a, b) { return new Box(a + b).v; }",
    tests: addTests,
  },
  {
    name: "a constant above the entry point",
    code: "class K {}\nfunction add(a, b) { return OFFSET + a + b; }\nconst OFFSET = 0;",
    tests: addTests,
  },
  {
    name: "top-level await",
    code: "const zero = await Promise.resolve(0);\nfunction add(a, b) { return zero + a + b; }",
    tests: addTests,
  },
  {
    name: "top-level await below the entry point",
    code: "function add(a, b) { return zero + a + b; }\nconst zero = await Promise.resolve(0);",
    tests: addTests,
  },
  {
    name: "await inside the entry point",
    code: "async function add(a, b) { const x = await Promise.resolve(a); const y = await new Promise((ok) => ok(b)); return x + y; }",
    tests: addTests,
  },
  {
    name: "for-await at the top level",
    code: "let zero = 0;\nfor await (const v of [Promise.resolve(0)]) zero += v;\nfunction add(a, b) { return zero + a + b; }",
    tests: addTests,
  },
  {
    name: "the starter stub kept above the answer",
    code: 'function add(a, b) { throw new Error("TODO"); }\nfunction add(a, b) { return a + b; }',
    tests: addTests,
  },
  {
    name: "a var hoisted over its function",
    code: "var add;\nfunction add(a, b) { return a + b; }",
    tests: addTests,
  },
  {
    name: "an inner use strict",
    code: '"use strict";\nfunction add(a, b) { "use strict"; return a + b; }',
    tests: addTests,
  },
  {
    name: "types on parameters and returns",
    code: "function add(a: number, b: number): number { const c: number = a + b; return c; }",
    tests: addTests,
  },
  {
    name: "an interface and a type alias",
    code: "interface Pair { a: number; b: number }\ntype Sum = number;\nfunction add(a: number, b: number): Sum { const p: Pair = { a, b }; return p.a + p.b; }",
    tests: addTests,
  },
  {
    name: "generics, as and non-null",
    code: "const add = (a: number, b: number): number => { const r = id<number>(a + b) as number; return r!; };\nfunction id<T>(x: T): T { return x; }",
    tests: [t("2, 3", "result === 5")],
  },
  {
    name: "an enum",
    code: "enum Op { Add = 1 }\nfunction add(a: number, b: number) { return Op.Add === 1 ? a + b : 0; }",
    tests: addTests,
  },
  {
    name: "parameter properties",
    code: "class P { constructor(public v: number) {} }\nfunction add(a: number, b: number) { return new P(a + b).v; }",
    tests: addTests,
  },
  {
    name: "optional chaining and nullish",
    code: "function add(a, b) { const o = { v: { a } }; return (o?.v?.a ?? 0) + b; }",
    tests: addTests,
  },
  {
    name: "a generator and destructuring",
    code: "function* pair(a, b) { yield a; yield b; }\nfunction add(a, b) { const [x, y] = [...pair(a, b)]; return x + y; }",
    tests: addTests,
  },
  {
    name: "a local helper named like a grader internal",
    code: 'function add(a, b) { return toBase58(a) + b; }\nconst BASE58_ALPHABET = "abc";\nfunction toBase58(n) { return n; }',
    tests: addTests,
  },
  {
    name: "console output",
    code: 'function add(a, b) { console.log("adding", a, { b }); console.error("x"); console.warn("y"); console.info("z"); return a + b; }',
    tests: addTests,
  },
  {
    name: "an export on the function",
    code: "export function add(a, b) { return a + b; }",
    tests: addTests,
  },
  {
    name: "an export on an async function",
    code: "export async function add(a, b) { return a + b; }",
    tests: addTests,
  },
  {
    name: "an export on a const",
    code: "export const add = (a: number, b: number) => a + b;",
    tests: addTests,
  },
  {
    name: "a default export",
    code: "export default function add(a, b) { return a + b; }",
    tests: addTests,
  },
  {
    name: "an export list",
    code: "function add(a, b) { return a + b; }\nexport { add };",
    tests: addTests,
  },
  {
    name: "a default export of a name",
    code: "function add(a, b) { return a + b; }\nexport default add;",
    tests: addTests,
  },
  {
    name: "exported types and a class beside the function",
    code: "export type N = number;\nexport interface I { v: N }\nexport class C {}\nexport function add(a: N, b: N): N { return a + b; }",
    tests: addTests,
  },

  // Result shapes.
  {
    name: "a boolean used as the verdict",
    code: "function isEven(n) { return n % 2 === 0; }",
    tests: [t("4", "result")],
  },
  {
    name: "a string",
    code: "function greet(n) { return `hi ${n}`; }",
    tests: [
      t(
        "'x'",
        "result === 'hi x' && result.length === 4 && result.startsWith('hi')"
      ),
    ],
  },
  {
    name: "null",
    code: "function none() { return null; }",
    tests: [t("", "result === null")],
  },
  {
    name: "undefined",
    code: "function none() {}",
    tests: [t("", "result === undefined && typeof result === 'undefined'")],
  },
  {
    name: "NaN, infinities and negative zero",
    code: "function nums() { return [NaN, Infinity, -Infinity, -0]; }",
    tests: [
      t(
        "",
        "Number.isNaN(result[0]) && result[1] === Infinity && result[2] === -Infinity && Object.is(result[3], -0)"
      ),
    ],
  },
  {
    name: "a bigint",
    code: "function big() { return 2n ** 64n; }",
    tests: [
      t("", "result === 18446744073709551616n && typeof result === 'bigint'"),
    ],
  },
  {
    name: "an array",
    code: "function list() { return [1, 'a', [2], { b: 3 }]; }",
    tests: [
      t(
        "",
        "Array.isArray(result) && result.length === 4 && result[2][0] === 2 && result[3].b === 3 && result.includes('a') && JSON.stringify(result) === '[1,\"a\",[2],{\"b\":3}]'"
      ),
    ],
  },
  {
    name: "a sparse array",
    code: "function list() { const a = [1]; a[2] = 3; return a; }",
    tests: [t("", "result.length === 3 && !(1 in result) && result[2] === 3")],
  },
  {
    name: "a regex match array",
    code: "function m() { return 'xay'.match(/a/); }",
    tests: [t("", "result[0] === 'a' && result.index === 1")],
  },
  {
    name: "a nested object",
    code: "function obj() { return { a: { b: { c: [1, { d: 'x' }] } }, u: undefined }; }",
    tests: [
      t(
        "",
        'result.a.b.c[1].d === \'x\' && \'u\' in result && Object.keys(result).join() === \'a,u\' && JSON.stringify(result) === \'{"a":{"b":{"c":[1,{"d":"x"}]}}}\''
      ),
    ],
  },
  {
    name: "shared references",
    code: "function shared() { const o = { v: 1 }; return { a: o, b: o }; }",
    tests: [t("", "result.a === result.b")],
  },
  {
    name: "a null-prototype object",
    code: "function bare() { const o = Object.create(null); o.a = 1; return o; }",
    tests: [t("", "result.a === 1 && Object.getPrototypeOf(result) === null")],
  },
  {
    name: "a frozen object",
    code: "function ice() { return Object.freeze({ a: 1 }); }",
    tests: [t("", "result.a === 1")],
  },
  {
    name: "a Uint8Array",
    code: "function bytes() { return new Uint8Array([1, 2, 255]); }",
    tests: [
      t(
        "",
        "result instanceof Uint8Array && result.length === 3 && result[2] === 255 && Array.from(result).join() === '1,2,255'"
      ),
    ],
  },
  {
    name: "other typed arrays",
    code: "function bytes() { return [new Uint16Array([500]), new Float64Array([1.5]), new BigInt64Array([5n])]; }",
    tests: [
      t(
        "",
        "result[0] instanceof Uint16Array && result[0][0] === 500 && result[1][0] === 1.5 && result[2][0] === 5n"
      ),
    ],
  },
  {
    name: "a typed array view",
    code: "function view() { const b = new Uint8Array([1, 2, 3, 4]); return b.subarray(1, 3); }",
    tests: [
      t(
        "",
        "result.length === 2 && result[0] === 2 && result.byteOffset === 1 && result.buffer.byteLength === 4"
      ),
    ],
  },
  {
    name: "an ArrayBuffer and a DataView",
    code: "function buf() { const b = new ArrayBuffer(4); const v = new DataView(b); v.setUint32(0, 7, true); return { b, v }; }",
    tests: [
      t(
        "",
        "result.b instanceof ArrayBuffer && result.b.byteLength === 4 && result.v.getUint32(0, true) === 7 && result.v.buffer === result.b"
      ),
    ],
  },
  {
    name: "a Map",
    code: "function m() { return new Map([['a', 1], ['b', { c: 2 }]]); }",
    tests: [
      t(
        "",
        "result instanceof Map && result.size === 2 && result.get('a') === 1 && result.get('b').c === 2 && result.has('b')"
      ),
    ],
  },
  {
    name: "a Set",
    code: "function s() { return new Set([1, 'a']); }",
    tests: [
      t("", "result instanceof Set && result.size === 2 && result.has('a')"),
    ],
  },
  {
    name: "a Date",
    code: "function d() { return new Date(0); }",
    tests: [t("", "result instanceof Date && result.getTime() === 0")],
  },
  {
    name: "a RegExp",
    code: "function r() { return /a+/gi; }",
    tests: [
      t(
        "",
        "result instanceof RegExp && result.source === 'a+' && result.flags === 'gi' && result.test('AA')"
      ),
    ],
  },
  {
    name: "an Error",
    code: "function e() { return new TypeError('bad'); }",
    tests: [
      t(
        "",
        "result instanceof TypeError && result instanceof Error && result.message === 'bad' && result.name === 'TypeError'"
      ),
    ],
  },
  {
    name: "a class instance with fields",
    code: "class A { constructor() { this.v = 1; } m() { return 2; } }\nfunction make() { return new A(); }",
    tests: [
      t(
        "",
        "result.v === 1 && typeof result.m === 'function' && Object.keys(result).join() === 'v' && JSON.stringify(result) === '{\"v\":1}' && result.constructor.name === 'A'"
      ),
    ],
  },
  {
    name: "a class instance with a getter",
    code: "class A { constructor() { this.a = 1; } get twice() { return this.a * 2; } }\nfunction make() { return new A(); }",
    tests: [t("", "result.twice === 2 && Object.keys(result).join() === 'a'")],
  },
  {
    name: "a subclass instance",
    code: "class A { get x() { return 1; } }\nclass B extends A { get y() { return 2; } }\nfunction make() { return new B(); }",
    tests: [t("", "result.x === 1 && result.y === 2")],
  },
  {
    name: "an object getter",
    code: "function make() { return { get a() { return 5; } }; }",
    tests: [t("", "result.a === 5 && Object.keys(result).join() === 'a'")],
  },
  {
    name: "a function result",
    code: "function make() { return function named(a, b) {}; }",
    tests: [
      t(
        "",
        "typeof result === 'function' && result.name === 'named' && result.length === 2"
      ),
    ],
  },
  {
    name: "a resolved promise",
    code: "function later() { return Promise.resolve({ a: 1 }); }",
    tests: [t("", "result.a === 1")],
  },
  {
    name: "a thenable",
    code: "function later() { return { then(ok) { ok(5); } }; }",
    tests: [t("", "result === 5")],
  },
  {
    name: "a typed shape",
    code: "function shape() { return { a: 'x', b: 1, c: true, d: {} }; }",
    tests: [t("", "{ a: string, b: number, c: boolean, d: object }")],
  },

  // Fixtures and the mock SDK.
  {
    name: "the data fixture",
    code: "function parse(data) { const v = new DataView(data.buffer, data.byteOffset, data.byteLength); const n = v.getUint32(5, true); return { version: v.getUint8(0), name: new TextDecoder().decode(data.slice(9, 9 + n)) }; }",
    tests: [
      t(
        "data",
        "result.version === 1 && result.name === 'SolDev' && data instanceof Uint8Array && data.length === 15"
      ),
    ],
  },
  {
    name: "the position fixture",
    code: "function ratio(position) { return position.collateral / position.debt; }",
    tests: [t("position", "result === 2 && position.threshold === 1.5")],
  },
  {
    name: "the account fixture",
    code: "function lamportsOf(account) { return account.lamports; }",
    tests: [
      t(
        "account",
        "result === 1000000 && account.executable === false && account.data.length === 3"
      ),
    ],
  },
  {
    name: "a mutated fixture",
    code: "function bump(position) { position.debt = 1; return 0; }",
    tests: [t("position", "position.debt === 1")],
  },
  {
    name: "a fixture read as a free variable",
    code: "function len() { return data.length; }",
    tests: [t("data", "result === 15")],
  },
  {
    name: "an unknown argument name",
    code: "function pass(thing) { return typeof thing; }",
    tests: [t("thing", "result === 'object' && typeof thing === 'object'")],
  },
  {
    name: "the payer fixture",
    code: "function who(pk) { return pk; }",
    tests: [
      t(
        "payer",
        "result.equals(payer.publicKey) && result === payer.publicKey && result.toBase58() === payer.publicKey.toBase58()"
      ),
    ],
  },
  {
    name: "the wallets fixture",
    code: "function n(w) { return w.map((x) => x.toBase58()); }",
    tests: [
      t(
        "wallets",
        "result.length === 3 && result[0] === wallets[0].toBase58()"
      ),
    ],
  },
  {
    name: "a program id fixture",
    code: "function id(p) { return p.toString(); }",
    tests: [t("programId", "result === programId.toBase58()")],
  },
  {
    name: "the connection fixture",
    code: "async function bal(c) { return c.getBalance(); }",
    tests: [
      t(
        "connection",
        "result === 2000000000 && typeof connection.getBalance === 'function'"
      ),
    ],
  },
  {
    name: "the mock SDK with named imports",
    code: 'import { Keypair, PublicKey } from "@solana/web3.js";\nfunction make() { return Keypair.generate().publicKey; }',
    tests: [
      t(
        "",
        "result.toBase58().length > 0 && result.toBytes().length === 32 && typeof result.equals === 'function'"
      ),
    ],
  },
  {
    name: "a mock Keypair",
    code: 'import { Keypair } from "@solana/web3.js";\nfunction make() { return Keypair.generate(); }',
    tests: [
      t(
        "",
        "result.secretKey.length === 64 && publicKey.toBase58().length > 0"
      ),
    ],
  },
  {
    name: "a mock Transaction",
    code: 'import { Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";\nfunction make() { return new Transaction().add(SystemProgram.transfer({ lamports: LAMPORTS_PER_SOL })); }',
    tests: [
      t("", "transaction.instructions.length === 1 && lamports === 1000000000"),
    ],
  },
  {
    name: "the mock SDK with require",
    code: 'const { PublicKey } = require("@solana/web3.js");\nfunction make() { return new PublicKey("11111111111111111111111111111111"); }',
    tests: [t("", "result.toBase58().length === 32")],
  },
  {
    name: "the mock spl-token module",
    code: 'import { createMint } from "@solana/spl-token";\nasync function make() { return createMint(); }',
    tests: [t("", "result.toBase58().length === 32")],
  },
  {
    name: "an isValid result",
    code: "function check() { return { isValid: true }; }",
    tests: [t("", "isValid === true")],
  },
  {
    name: "assertions with TextEncoder",
    code: "function enc() { return new TextEncoder().encode('hi'); }",
    tests: [t("", "new TextDecoder().decode(result) === 'hi'")],
  },
];
