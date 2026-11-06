import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminTestCase } from "@superteam-lms/types";
import { judgeSnapshot, runJsSubmission } from "../executor";
import { SUBMISSION_SHAPES } from "./fixtures/js-submission-shapes";

const LOOSE_TIMEOUT_MS = 30_000;

function testCase(input: string, expectedOutput: string): AdminTestCase {
  return { id: "t", description: "", input, expectedOutput };
}

async function run(code: string, tests: AdminTestCase[]) {
  const r = await runJsSubmission(code, tests);
  if (!r.available) throw new Error("executor unavailable");
  return r;
}

async function expectAllFailed(code: string, tests: AdminTestCase[]) {
  const r = await run(code, tests);
  expect(r.results).toHaveLength(tests.length);
  expect(r.results.map((t) => t.passed)).toEqual(tests.map(() => false));
  expect(r.passed).toBe(false);
  return r;
}

describe("submission syntax", () => {
  it.each([
    ["after a function", 'function add(a, b) { return 0; }\nreturn "pass";'],
    ["as true", "function add(a, b) { return 0; }\nreturn true;"],
    ["in a block", 'function add(a, b) { return 0; }\n{ return "pass"; }'],
    ["behind a branch", 'function add() { return 0; }\nif (1) return "pass";'],
    [
      "in a try",
      'function add() { return 0; }\ntry { return "pass"; } catch {}',
    ],
    [
      "after an await",
      'function add() { return 0; }\nawait 0;\nreturn "pass";',
    ],
    ["before a function", 'return "pass";\nfunction add() { return 0; }'],
  ])(
    "rejects a top-level return %s as a syntax error",
    async (_label, code) => {
      const r = await expectAllFailed(code, [testCase("2, 3", "result === 5")]);
      expect(r.results[0]?.detail).toMatch(/syntax error/i);
    }
  );

  it.each([
    [
      "an unbalanced brace",
      'function add() { return 0; }\n}); return "pass"; (function () {',
    ],
    ["an open block comment", "function add() { return 0; }\n/*"],
    ["an open template", "function add() { return 0; }\nconst t = `"],
    ["an open paren", "function add() { return 0; }\n("],
  ])("rejects %s without reaching the assertion", async (_label, code) => {
    await expectAllFailed(code, [testCase("2, 3", "result === 5")]);
  });

  it("still allows return inside functions, methods and arrows", async () => {
    const code = `class Calc { add(a, b) { return a + b; } }
function add(a, b) { return twice(new Calc().add(a, b)) / 2; }
const twice = (x) => { return x * 2; };`;
    expect((await run(code, [testCase("2, 3", "result === 5")])).passed).toBe(
      true
    );
  });
});

describe("assertion isolation", () => {
  // Each case returns a value the assertion must reject, whatever else it does.
  it.each([
    [
      "JSON.stringify",
      'JSON.stringify = () => "[999]"; return [1];',
      'JSON.stringify(result) === "[999]"',
    ],
    [
      "JSON.parse",
      'JSON.parse = () => 999; return "1";',
      "JSON.parse(result) === 999",
    ],
    [
      "Array.isArray",
      "Array.isArray = () => true; return 1;",
      "Array.isArray(result)",
    ],
    [
      "Object.keys",
      'Object.keys = () => ["a", "b"]; return {};',
      "Object.keys(result).length === 2",
    ],
    [
      "Object.is",
      "Object.is = () => true; return 1;",
      "Object.is(result, 999)",
    ],
    [
      "Number.isInteger",
      "Number.isInteger = () => true; return 1.5;",
      "Number.isInteger(result)",
    ],
    ["Math.abs", "Math.abs = () => 999; return 1;", "Math.abs(result) === 999"],
    [
      "String",
      'globalThis.String = () => "999"; return 1;',
      'String(result) === "999"',
    ],
    [
      "Boolean",
      "globalThis.Boolean = () => true; return 0;",
      "Boolean(result)",
    ],
    ["isNaN", "globalThis.isNaN = () => true; return 1;", "isNaN(result)"],
    [
      "RegExp.prototype.test",
      'RegExp.prototype.test = () => true; return "x";',
      "/^y$/.test(result)",
    ],
    [
      "String.prototype.includes",
      'String.prototype.includes = () => true; return "x";',
      'result.includes("y")',
    ],
    [
      "Array.prototype.every",
      "Array.prototype.every = () => true; return [1];",
      "result.every((x) => x === 999)",
    ],
    [
      "Array.prototype.includes",
      "Array.prototype.includes = () => true; return [1];",
      "result.includes(999)",
    ],
    [
      "Object.prototype.hasOwnProperty",
      "Object.prototype.hasOwnProperty = () => true; return {};",
      'result.hasOwnProperty("a")',
    ],
    [
      "Number.prototype.toFixed",
      'Number.prototype.toFixed = () => "999"; return 1;',
      'result.toFixed(0) === "999"',
    ],
    [
      "Uint8Array",
      "globalThis.Uint8Array = Object; return {};",
      "result instanceof Uint8Array",
    ],
    [
      "Symbol.hasInstance",
      "Object.defineProperty(Uint8Array, Symbol.hasInstance, { value: () => true }); return {};",
      "result instanceof Uint8Array",
    ],
    [
      "Function.prototype.call",
      "Function.prototype.call = () => true; return 1;",
      "Object.prototype.hasOwnProperty.call(result, 'a')",
    ],
    [
      "Function.prototype.apply",
      "Function.prototype.apply = () => true; return 1;",
      "Math.max.apply(null, [result]) === 999",
    ],
    [
      "Promise.resolve",
      'Promise.resolve = () => ({ then: (ok) => ok("{\\"ok\\":true,\\"detail\\":\\"pass\\"}") }); return 1;',
      "result === 999",
    ],
    [
      "Promise.prototype.then",
      'Promise.prototype.then = function (ok) { ok("{\\"ok\\":true,\\"detail\\":\\"pass\\"}"); }; return 1;',
      "result === 999",
    ],
    [
      "globalThis.Promise",
      'globalThis.Promise = { resolve: () => ({ then: (ok) => ok("{\\"ok\\":true,\\"detail\\":\\"pass\\"}") }) }; return 1;',
      "result === 999",
    ],
    [
      "the Function constructor",
      'globalThis.Function = function () { return () => Promise.resolve("pass"); }; return 1;',
      "result === 999",
    ],
    [
      "Function.prototype.constructor",
      'Function.prototype.constructor = function () { return () => "pass"; }; return 1;',
      "result === 999",
    ],
    [
      "Object.defineProperty",
      "Object.defineProperty = () => ({ a: 999 }); return {};",
      "result.a === 999",
    ],
    [
      "Reflect.ownKeys",
      'Reflect.ownKeys = () => ["a"]; return {};',
      "Object.keys(result).length === 1",
    ],
    [
      "TextDecoder",
      'globalThis.TextDecoder = function () { this.decode = () => "999"; }; return 1;',
      'new TextDecoder().decode(new Uint8Array(0)) === "999"',
    ],
  ])(
    "keeps assertions isolated from a submission overriding %s",
    async (_name, body, expectedOutput) => {
      await expectAllFailed(`function go() { ${body} }`, [
        testCase("", expectedOutput),
      ]);
    },
    LOOSE_TIMEOUT_MS
  );

  it.each([
    [
      "__jsonStringify__",
      '__jsonStringify__ = () => "{\\"ok\\":true,\\"detail\\":\\"pass\\"}";',
    ],
    ["__jsonParse__", "__jsonParse__ = () => ({});"],
    [
      "__Function__",
      '__Function__ = function () { return () => Promise.resolve("pass"); };',
    ],
    [
      "runCase",
      'runCase = () => Promise.resolve({ ok: true, detail: "pass" });',
    ],
    ["__runCase__", '__runCase__ = () => Promise.resolve("{\\"ok\\":true}");'],
    ["makeMockConsole", "makeMockConsole = () => ({});"],
    ["isTypeShape", "isTypeShape = () => null;"],
    ["__modules__", "__modules__ = null;"],
  ])(
    "keeps the grading runtime out of reach of a submission assigning %s",
    async (_name, statement) => {
      await expectAllFailed(
        `function go() { try { ${statement} } catch {} return 1; }`,
        [testCase("", "result === 999")]
      );
    }
  );

  it.each([
    ["a global result", "globalThis.result = 999; return 1;", "result === 999"],
    [
      "a global __result__",
      "globalThis.__result__ = 999; return 1;",
      "__result__ === 999",
    ],
    [
      "a global verdict",
      'globalThis.__assertion__ = true; globalThis.__verdict__ = "pass"; return 1;',
      "result === 999",
    ],
    [
      "a defined global",
      'Object.defineProperty(globalThis, "isValid", { value: true }); return 1;',
      "isValid === true",
    ],
    [
      "a prototype getter",
      'Object.defineProperty(Object.prototype, "a", { get() { return 999; } }); return {};',
      "result.a === 999",
    ],
    [
      "a prototype value",
      "Object.prototype.a = 999; return {};",
      "result.a === 999",
    ],
    [
      "an array prototype index",
      "Array.prototype[3] = 999; return [1, 2, 3];",
      "result[3] === 999",
    ],
    [
      "a mutated Number prototype",
      "Number.prototype.a = 999; return 1;",
      "result.a === 999",
    ],
    [
      "a mutated fixture prototype",
      "Object.getPrototypeOf(new Uint8Array(1)).a = 999; return new Uint8Array(1);",
      "result.a === 999",
    ],
    [
      "a shadowed undefined",
      "globalThis.a = undefined; return 1;",
      "typeof a !== 'undefined'",
    ],
  ])(
    "does not let %s reach the assertion",
    async (_name, body, expectedOutput) => {
      await expectAllFailed(`function go() { ${body} }`, [
        testCase("", expectedOutput),
      ]);
    }
  );

  it.each([
    ["valueOf", "return { valueOf() { return 999; } };", "result == 999"],
    [
      "Symbol.toPrimitive",
      "return { [Symbol.toPrimitive]() { return 999; } };",
      "result == 999",
    ],
    [
      "toString",
      'return { toString() { return "999"; } };',
      'String(result) === "999"',
    ],
    [
      "toJSON",
      "return { toJSON() { return 999; } };",
      'JSON.stringify(result) === "999"',
    ],
    ["a method", "return { equals() { return true; } };", "result.equals(999)"],
    [
      "a class method",
      "class A { equals() { return true; } } return new A();",
      "result.equals(999)",
    ],
    [
      "a Proxy",
      "return new Proxy({}, { get: () => 999 });",
      "result.a === 999",
    ],
    [
      "a has trap",
      "return new Proxy({}, { has: () => true });",
      '"a" in result',
    ],
    ["a thenable", 'return { then(ok) { ok("pass"); } };', "result === 999"],
    ["a function", "return () => true;", "result()"],
    ["a mimicked encoding", "return [0, 1];", "typeof result === 'function'"],
    [
      "a __proto__ key",
      'return JSON.parse(\'{"__proto__":{"a":999}}\');',
      "result.a === 999",
    ],
    ["a string verdict", 'return "pass";', "result"],
    ["a string verdict in a shape", 'return { a: "pass" };', "result.a"],
  ])(
    "reads a returned object as data, not code: %s",
    async (_name, body, expectedOutput) => {
      await expectAllFailed(`function go() { ${body} }`, [
        testCase("", expectedOutput),
      ]);
    }
  );

  it("does not let a __proto__ key in a result reach other objects", async () => {
    const r = await run(
      `function go() { return JSON.parse('{"__proto__":{"a":999}}'); }`,
      [testCase("", "({}).a === undefined")]
    );
    expect(r.passed).toBe(true);
  });

  it.each([
    ["a thrown string", 'function go() { throw "pass"; }'],
    ["a thrown true", "function go() { throw true; }"],
    [
      "a thrown object",
      'function go() { throw { message: "pass", ok: true }; }',
    ],
    ["a top-level throw", 'function go() { return 1; }\nthrow "pass";'],
    [
      "a rejected promise",
      'async function go() { return Promise.reject("pass"); }',
    ],
    [
      "a top-level rejection",
      'function go() { return 1; }\nawait Promise.reject("pass");',
    ],
    [
      "a throwing getter",
      'function go() { return { get a() { throw "pass"; } }; }',
    ],
    [
      "a throwing Proxy",
      'function go() { return new Proxy({}, { ownKeys() { throw "pass"; } }); }',
    ],
  ])("does not take %s for a passing verdict", async (_name, code) => {
    await expectAllFailed(code, [testCase("", "result === 999")]);
  });

  it.each([
    ["process.exit", "process.exit(0);"],
    [
      "a defined process",
      "globalThis.process = { exit() {} }; process.exit(0);",
    ],
    ["quit", "quit();"],
    ["std.exit", "std.exit(0);"],
    ["os.exit", "os.exit(0);"],
    ["require", 'require("process").exit(0);'],
    [
      "a dynamic import",
      'const load = "imp" + "ort"; eval(load + "(\\"os\\")");',
    ],
    ["an early microtask", 'Promise.resolve().then(() => { throw "pass"; });'],
    [
      "a never-ending promise chain",
      "(function spin() { Promise.resolve().then(spin); })();",
    ],
  ])(
    "ending a run through %s fails the test and leaves the executor usable",
    async (_name, statement) => {
      await expectAllFailed(`function go() { ${statement} return 1; }`, [
        testCase("", "result === 999"),
      ]);
      expect(
        (
          await run("function add(a, b) { return a + b; }", [
            testCase("2, 3", "result === 5"),
          ])
        ).passed
      ).toBe(true);
    },
    LOOSE_TIMEOUT_MS
  );

  it("runs each test in a new runtime", async () => {
    const r = await run(
      "function go() { globalThis.n = (globalThis.n || 0) + 1; return globalThis.n; }",
      [testCase("", "result === 1"), testCase("", "result === 1")]
    );
    expect(r.passed).toBe(true);
  });
});

describe("snapshot handling", () => {
  const snapshot = (
    root: unknown,
    nodes: unknown = [],
    fixtures: unknown = []
  ) => JSON.stringify({ root, fixtures, nodes });
  const denied = async (text: string, expectedOutput: string, input = "") => {
    const started = Date.now();
    const verdict = await judgeSnapshot(text, { input, expectedOutput });
    expect(verdict.passed).toBe(false);
    expect(Date.now() - started).toBeLessThan(4_000);
  };

  it("accepts the format a real run produces", async () => {
    const r = await judgeSnapshot(snapshot(5), {
      input: "",
      expectedOutput: "result === 5",
    });
    expect(r.passed).toBe(true);
  });

  it.each([
    ["a non-identifier name", [["not an identifier", 5]]],
    ["a name with punctuation", [["a, b", 5]]],
    ["a name that is a reserved word", [["class", 5]]],
    ["a name matching a global", [["String", 5]]],
    ["a name matching the result", [["result", 5]]],
    ["a name matching the assertion", [["__assertion__", true]]],
    ["more entries than the test has", [5, 5, 5]],
    ["a non-array entry", [{ name: "a" }]],
  ])("takes no names from a snapshot with %s", async (_label, fixtures) => {
    await denied(snapshot(1, [], fixtures), "false");
    await denied(snapshot(1, [], fixtures), "result === 5");
  });

  it("reads fixtures by the test's own input", async () => {
    const r = await judgeSnapshot(snapshot(1, [], [5]), {
      input: "thing",
      expectedOutput: "thing === 5 && result === 1",
    });
    expect(r.passed).toBe(true);
  });

  it.each([
    ["an inherited key", [0, "__proto__"]],
    ["another inherited key", [0, "constructor"]],
    ["a length key", [0, "length"]],
    ["a negative id", [0, -1]],
    ["a fractional id", [0, 0.5]],
    ["an id past the table", [0, 99]],
    ["a null id", [0, null]],
    ["an array id", [0, [0]]],
    ["an unknown tag", [9, 0]],
    ["a non-array value", { "0": 0 }],
    ["a malformed bigint", [2, "not a number"]],
    ["a non-string bigint", [2, 5]],
    ["a very long bigint", [2, "1".repeat(2_000_000)]],
    ["an unknown number name", [3, "__proto__"]],
  ])("rejects a reference that is %s", async (_label, ref) => {
    await denied(snapshot(ref), "result !== 5");
    await denied(
      snapshot(1, [{ k: "o", p: [["a", ref, true]] }]),
      "true || result"
    );
  });

  it.each([
    [
      "a boxed object",
      [
        { k: "x", v: [0, 1] },
        { k: "o", p: [] },
      ],
    ],
    [
      "a date from an object",
      [
        { k: "d", t: [0, 1] },
        { k: "o", p: [] },
      ],
    ],
    ["a null node", [null]],
    ["an array node", [[]]],
    ["a string node", ["o"]],
    ["an unknown kind", [{ k: "zzz" }]],
    ["an inherited kind", [{ k: "__proto__" }]],
    ["a kindless node", [{}]],
    ["an array longer than its items", [{ k: "a", n: 4294967295, i: [] }]],
    ["an array shorter than its items", [{ k: "a", n: 0, i: [1] }]],
    ["a negative array length", [{ k: "a", n: -1, i: [] }]],
    ["an array of huge length", [{ k: "a", n: 1e12, i: [], p: [] }]],
    ["an array with non-array items", [{ k: "a", n: 1, i: { length: 1 } }]],
    [
      "an array length property",
      [{ k: "a", n: 0, i: [], p: [["length", 4294967295, false]] }],
    ],
    [
      "an array index property",
      [{ k: "a", n: 0, i: [], p: [["4294967294", 1, true]] }],
    ],
    ["non-array properties", [{ k: "o", p: { length: 1 } }]],
    ["a non-string property key", [{ k: "o", p: [[1, 1, true]] }]],
    ["a non-array property", [{ k: "o", p: [1] }]],
    [
      "an unknown typed array",
      [
        { k: "t", c: "Function", b: [0, 1], o: 0, n: 0 },
        { k: "b", d: [] },
      ],
    ],
    [
      "an inherited typed array",
      [
        { k: "t", c: "constructor", b: [0, 1], o: 0, n: 0 },
        { k: "b", d: [] },
      ],
    ],
    [
      "a view on a non-buffer",
      [
        { k: "t", c: "Uint8Array", b: [0, 1], o: 0, n: 0 },
        { k: "o", p: [] },
      ],
    ],
    [
      "a view past its buffer",
      [
        { k: "t", c: "Uint8Array", b: [0, 1], o: 0, n: 1e9 },
        { k: "b", d: [] },
      ],
    ],
    ["a primitive as a view's buffer", [{ k: "v", b: 8, o: 0, n: 0 }]],
    ["non-byte buffer contents", [{ k: "b", d: ["x"] }]],
    ["a huge buffer", [{ k: "b", d: { length: 1e12 } }]],
    ["non-array map entries", [{ k: "m", e: { length: 1 } }]],
    ["non-pair map entries", [{ k: "m", e: [1] }]],
    ["non-array set entries", [{ k: "s", e: 1 }]],
    ["an unknown mock", [{ k: "k", c: "Object" }]],
    ["an inherited mock", [{ k: "k", c: "__proto__" }]],
    ["a non-string regexp", [{ k: "r", s: 1, f: "", li: 0 }]],
    ["a bad regexp", [{ k: "r", s: "(", f: "", li: 0 }]],
    ["a non-string function name", [{ k: "f", name: {}, len: 0 }]],
    ["a bad function length", [{ k: "f", name: "x", len: -1 }]],
  ])("rejects a node that is %s", async (_label, nodes) => {
    await denied(snapshot([0, 0], nodes), "true");
  });

  it.each([
    ["no text", ""],
    ["text that isn't JSON", "not json"],
    ["a JSON null", "null"],
    ["a JSON number", "1"],
    ["a JSON array", "[]"],
    ["no node table", '{"root":1,"fixtures":[]}'],
    ["no fixture list", '{"root":1,"nodes":[]}'],
    ["a node table object", '{"root":1,"fixtures":[],"nodes":{"length":1}}'],
    [
      "an over-long node table",
      '{"root":1,"fixtures":[],"nodes":{"length":1e12}}',
    ],
  ])("rejects a snapshot that is %s", async (_label, text) => {
    await denied(text, "true");
  });

  it("does not let snapshot keys reach shared prototypes", async () => {
    const r = await judgeSnapshot(
      snapshot(
        [0, 0],
        [
          {
            k: "o",
            p: [
              ["__proto__", [0, 1], true],
              ["constructor", 1, true],
            ],
          },
          { k: "o", p: [["polluted", 1, true]] },
        ]
      ),
      {
        input: "",
        expectedOutput:
          "({}).polluted === undefined && [].polluted === undefined && Object.getPrototypeOf(result) === Object.prototype && result.constructor === 1",
      }
    );
    expect(r.passed).toBe(true);
  });

  it.each([
    ["Object", "Object.prototype.toJSON = () => 999; return 1;"],
    ["Array", "Array.prototype.toJSON = () => 999; return 1;"],
    [
      "Object and Array",
      "Object.prototype.toJSON = Array.prototype.toJSON = () => 999; return 1;",
    ],
    ["String", 'String.prototype.toJSON = () => "x"; return 1;'],
  ])(
    "reads a result the same with toJSON on the %s prototype",
    async (_label, body) => {
      await expectAllFailed(`function go() { ${body} }`, [
        testCase("", "false"),
        testCase("", "result === 999"),
      ]);
      const r = await run(`function go() { ${body} }`, [
        testCase("", "result === 1"),
      ]);
      expect(r.passed).toBe(true);
    }
  );
});

describe("resource limits", () => {
  const eightTests = Array.from({ length: 8 }, (_, i) => ({
    ...testCase("", "true"),
    id: `t${i}`,
  }));

  // One test may take the per-test timeout, but eight may not take eight of them.
  it.each([
    ["a CPU loop", "function go() { while (true) {} }"],
    ["a microtask loop", "async function go() { while (true) { await 0; } }"],
  ])(
    "caps the whole submission's wall clock for %s",
    async (_label, code) => {
      const started = Date.now();
      const r = await expectAllFailed(code, eightTests);
      expect(Date.now() - started).toBeLessThan(20_000);
      expect(r.results.at(-1)?.detail).toBe("Execution budget exceeded");
    },
    60_000
  );

  it.each([
    ["at the top level", "function go() {}\nwhile (true) {}"],
    ["after an await", "async function go() { await 0; while (true) {} }"],
    [
      "in a getter on the result",
      "function go() { return { get a() { while (true) {} } }; }",
    ],
  ])(
    "interrupts a CPU loop %s",
    async (_label, code) => {
      const r = await expectAllFailed(code, [testCase("", "true")]);
      expect(r.results[0]?.detail).toMatch(/timed out|interrupted/i);
    },
    LOOSE_TIMEOUT_MS
  );

  it.each([
    [
      "a promise that never settles",
      "async function go() { await new Promise(() => {}); }",
    ],
    [
      "a top-level await that never settles",
      "function go() {}\nawait new Promise(() => {});",
    ],
    [
      "a thenable that never settles",
      "function go() { return { then() {} }; }",
    ],
  ])(
    "does not wait out the budget on %s",
    async (_label, code) => {
      const started = Date.now();
      await expectAllFailed(code, eightTests);
      expect(Date.now() - started).toBeLessThan(5_000);
    },
    60_000
  );

  it.each([
    [
      "while running",
      "function go() { const a = []; while (true) a.push(new Array(1e5).fill(0)); }",
    ],
    [
      "in a returned string",
      'function go() { let s = "x"; while (true) s += s; }',
    ],
    [
      "in a large returned string",
      'function go() { return "x".repeat(2 ** 24 + 1); }',
    ],
    [
      "in a large wide string",
      'function go() { return "\\u4e00".repeat(2 ** 24 - 2 ** 20); }',
    ],
    [
      "near the cap in a returned string",
      'function go() { return "x".repeat(30 * 1024 * 1024); }',
    ],
    [
      "in a large typed array",
      "function go() { return new Uint8Array(2 ** 24); }",
    ],
    [
      "in a returned graph",
      "function go() { const a = []; for (let i = 0; i < 3e6; i++) a.push({}); return a; }",
    ],
  ])(
    "holds the heap cap %s and stays usable",
    async (_label, code) => {
      await expectAllFailed(code, [testCase("", "true")]);
      expect(
        (
          await run("function add(a, b) { return a + b; }", [
            testCase("2, 3", "result === 5"),
          ])
        ).passed
      ).toBe(true);
    },
    LOOSE_TIMEOUT_MS
  );

  it.each([
    [
      "plain recursion",
      "function go() { function f() { return f() + 1; } return f(); }",
    ],
    [
      "recursion through a callback",
      "function go() { const f = (n) => [n].map(f); return f(1); }",
    ],
    [
      "recursion through a getter",
      "function go() { const o = { get a() { return this.a; } }; return o.a; }",
    ],
    [
      "recursion in a builtin: stringify",
      "function go() { let o = []; for (let i = 0; i < 1e5; i++) o = [o]; return JSON.stringify(o); }",
    ],
    [
      "recursion in a builtin: parse",
      'function go() { return JSON.parse("[".repeat(1e6) + "]".repeat(1e6)); }',
    ],
    [
      "recursion in a builtin: flat",
      "function go() { let a = []; for (let i = 0; i < 1e5; i++) a = [a]; return a.flat(Infinity); }",
    ],
    [
      "recursion through a Proxy chain",
      "function go() { let p = {}; for (let i = 0; i < 2e5; i++) p = new Proxy(p, {}); return Object.getPrototypeOf(p); }",
    ],
  ])(
    "fails %s as a wrong answer and stays usable",
    async (_label, code) => {
      await expectAllFailed(code, [testCase("", "result === 999")]);
      expect(
        (
          await run("function add(a, b) { return a + b; }", [
            testCase("2, 3", "result === 5"),
          ])
        ).passed
      ).toBe(true);
    },
    LOOSE_TIMEOUT_MS
  );

  it.each([
    [
      "recursion past the stack cap",
      "function go() { function f(n) { return n + f(n + 1); } return f(0); }",
    ],
    [
      "recursion in a builtin",
      "function go() { let o = []; for (let i = 0; i < 1e5; i++) o = [o]; return JSON.stringify(o); }",
    ],
    [
      "a heap overrun",
      "function go() { const a = []; while (true) a.push(new Array(1e5).fill(0)); }",
    ],
    [
      "a result over the size cap",
      "function go() { return new Uint8Array(2 ** 24); }",
    ],
  ])(
    "marks %s as a limit, not a wrong answer",
    async (_label, code) => {
      const r = await expectAllFailed(code, [testCase("", "result === 999")]);
      expect(r.results[0]).toMatchObject({ limit: true });
    },
    LOOSE_TIMEOUT_MS
  );

  it("marks a timeout and the tests the budget cut off as limits", async () => {
    const r = await expectAllFailed(
      "function go() { while (true) {} }",
      eightTests
    );
    expect(r.results.every((t) => t.limit === true)).toBe(true);
  }, 60_000);

  it.each([
    ["a wrong answer", "function go() { return 1; }"],
    ["a thrown error", 'function go() { throw new Error("x"); }'],
    ["a syntax error", "function go( {"],
    ["no function", "const x = 1;"],
    [
      "a promise that never settles",
      "async function go() { await new Promise(() => {}); }",
    ],
  ])("does not mark %s as a limit", async (_label, code) => {
    const r = await expectAllFailed(code, [testCase("", "result === 999")]);
    expect(r.results[0]?.limit).toBeUndefined();
  });

  it(
    "does not fail a correct request running alongside one that overflows",
    async () => {
      const overflow =
        "function go() { let o = []; for (let i = 0; i < 1e5; i++) o = [o]; return JSON.stringify(o); }";
      const correct = "function add(a, b) { return a + b; }";
      const tests = [testCase("2, 3", "result === 5")];
      const [first, second, third] = await Promise.all([
        run(overflow, [testCase("", "true")]),
        run(correct, tests),
        run(correct, tests),
      ]);
      expect(first.passed).toBe(false);
      expect(second.passed).toBe(true);
      expect(third.passed).toBe(true);
    },
    LOOSE_TIMEOUT_MS
  );

  it(
    "still grades the tests after one that overflows",
    async () => {
      const r = await run(
        `function go(deep) {
        if (!deep) return 1;
        let o = [];
        for (let i = 0; i < 1e5; i++) o = [o];
        return JSON.stringify(o);
      }`,
        [testCase("true", "result === 999"), testCase("false", "result === 1")]
      );
      expect(r.results.map((t) => t.passed)).toEqual([false, true]);
    },
    LOOSE_TIMEOUT_MS
  );

  it(
    "fails an assertion that overflows on a deep result",
    async () => {
      await expectAllFailed(
        "function go() { let n = {}; for (let i = 0; i < 2e5; i++) n = { n }; return n; }",
        [testCase("", "JSON.stringify(result).length > 0")]
      );
    },
    LOOSE_TIMEOUT_MS
  );

  it("reads a deep or cyclic result without overflowing", async () => {
    const r = await run(
      `function go() {
        let n = { v: 1 };
        for (let i = 0; i < 20000; i++) n = { next: n };
        const self = { n };
        self.self = self;
        return self;
      }`,
      [
        testCase(
          "",
          "result.self.self === result && typeof result.n.next === 'object'"
        ),
      ]
    );
    expect(r.passed).toBe(true);
  });
});

describe("submission shapes the server accepts", () => {
  it.each(SUBMISSION_SHAPES)("$name", async ({ code, tests }) => {
    const r = await run(code, tests);
    expect(r.results.filter((x) => !x.passed)).toEqual([]);
    expect(r.passed).toBe(true);
  });
});

describe("WASM instance failure", () => {
  const tests = [testCase("2, 3", "result === 5")];
  const code = "function add(a, b) { return a + b; }";

  afterEach(() => {
    vi.doUnmock("quickjs-emscripten-core");
    vi.resetModules();
  });

  /** Loads the executor with the first `broken` instances failing every call. */
  async function withBrokenInstances(broken: number) {
    const real = await vi.importActual<
      typeof import("quickjs-emscripten-core")
    >("quickjs-emscripten-core");
    const state = { loads: 0 };
    vi.resetModules();
    vi.doMock("quickjs-emscripten-core", () => ({
      ...real,
      newQuickJSWASMModuleFromVariant: async (
        ...args: Parameters<typeof real.newQuickJSWASMModuleFromVariant>
      ) => {
        state.loads += 1;
        if (state.loads > broken) {
          return real.newQuickJSWASMModuleFromVariant(...args);
        }
        return {
          newRuntime() {
            throw new Error("Aborted");
          },
        };
      },
    }));
    const { runJsSubmission: fresh } =
      await import("@superteam-lms/challenge-executor");
    return { fresh, state };
  }

  it("fails the test and carries on with a new instance", async () => {
    const { fresh, state } = await withBrokenInstances(1);
    expect(
      await fresh(code, [...tests, { ...tests[0]!, id: "u" }])
    ).toMatchObject({
      available: true,
      passed: false,
      results: [
        { id: "t", passed: false },
        { id: "u", passed: true },
      ],
    });
    expect(await fresh(code, tests)).toMatchObject({
      available: true,
      passed: true,
    });
    expect(state.loads).toBe(2);
  });

  it("reports the executor unavailable when a new instance fails too", async () => {
    const { fresh } = await withBrokenInstances(2);
    expect(await fresh(code, tests)).toEqual({
      available: false,
      reason: "executor_unavailable",
    });
  });
});
