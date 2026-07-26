import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

/**
 * Duplicate-key guard for the raw locale files. `parity.test.ts` imports the
 * PARSED JSON, so a key defined twice in the same object is silently collapsed
 * (last one wins) before that test ever sees it — a shadowed definition that
 * changes copy at runtime yet leaves parity green. This scans the source TEXT
 * and fails on any key repeated within the same object.
 *
 * Object-scoped by design: the same key name in different objects (e.g. many
 * sections have a `title`) is legal; only a repeat inside one `{}` is a bug.
 */
function findDuplicateKeys(text: string): string[] {
  const dupes: string[] = [];
  const stack: Array<Set<string> | null> = []; // Set = object scope, null = array
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"') {
      let key = "";
      i++; // consume opening quote
      while (i < text.length && text[i] !== '"') {
        if (text[i] === "\\") key += text[i++];
        key += text[i++];
      }
      i++; // consume closing quote
      let j = i;
      while (j < text.length && /\s/.test(text[j]!)) j++;
      if (text[j] === ":") {
        const scope = stack[stack.length - 1];
        if (scope instanceof Set) {
          if (scope.has(key)) dupes.push(key);
          else scope.add(key);
        }
      }
      continue;
    }
    if (c === "{") stack.push(new Set());
    else if (c === "[") stack.push(null);
    else if (c === "}" || c === "]") stack.pop();
    i++;
  }
  return dupes;
}

const LOCALES = ["en", "es", "pt-BR"] as const;

describe("i18n locale files have no duplicate keys within any object", () => {
  it("sanity: the scanner flags a known duplicate", () => {
    expect(findDuplicateKeys('{"a":1,"b":{"x":1},"a":2}')).toEqual(["a"]);
    expect(findDuplicateKeys('{"a":1,"b":{"a":2}}')).toEqual([]);
    expect(findDuplicateKeys('{"a":"has:colon","a":"x"}')).toEqual(["a"]);
  });

  for (const locale of LOCALES) {
    it(`${locale}.json defines each key at most once per object`, () => {
      const text = readFileSync(
        new URL(`../${locale}.json`, import.meta.url),
        "utf8"
      );
      expect(findDuplicateKeys(text)).toEqual([]);
    });
  }
});
