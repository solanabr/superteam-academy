import { describe, it, expect } from "vitest";
import en from "../en.json";
import ptBR from "../pt-BR.json";
import es from "../es.json";

/**
 * Deep i18n key-structure parity guard (no equivalent existed before this
 * task). `apps/web/CLAUDE.md` states all 3 locale files must have identical
 * key structures — a mismatch surfaces as `MISSING_MESSAGE` at runtime,
 * silently, only for the locale that's missing the key. This recursively
 * flattens each message tree to a sorted list of dot-path leaf keys and
 * fails per-locale on any key present in another locale but missing here.
 */

type MessageValue = string | { [key: string]: MessageValue };
type MessageTree = { [key: string]: MessageValue };

function flattenKeys(tree: MessageTree, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      keys.push(...flattenKeys(value as MessageTree, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

const locales: Record<string, MessageTree> = {
  en: en as MessageTree,
  "pt-BR": ptBR as MessageTree,
  es: es as MessageTree,
};

const keysByLocale = Object.fromEntries(
  Object.entries(locales).map(([name, tree]) => [name, flattenKeys(tree)])
);

const unionOfAllKeys = Array.from(
  new Set(Object.values(keysByLocale).flat())
).sort();

describe("i18n message parity (en / pt-BR / es)", () => {
  it("has a non-empty key set to compare (sanity check the fixtures loaded)", () => {
    expect(unionOfAllKeys.length).toBeGreaterThan(0);
  });

  for (const [locale, keys] of Object.entries(keysByLocale)) {
    it(`${locale}.json contains every key present in the other locales`, () => {
      const present = new Set(keys);
      const missing = unionOfAllKeys.filter((k) => !present.has(k));
      expect(missing).toEqual([]);
    });
  }
});
