import { describe, it, expect } from "vitest";
import en from "../en.json";
import ptBR from "../pt-BR.json";
import es from "../es.json";

/**
 * i18n key-structure parity guard (#1047). `apps/web/CLAUDE.md` states all 3
 * locale files must have identical key structures — a mismatch surfaces as
 * `MISSING_MESSAGE` at runtime, silently, only for the affected locale.
 *
 * en.json is canonical. For each other locale this collects every key path
 * (intermediate objects and string leaves) and fails on:
 *   - missing: path exists in en.json but not in the locale
 *   - extra:   path exists in the locale but not in en.json
 *   - type mismatch: path exists in both but is a string in one and an
 *     object in the other
 * The offending paths are listed verbatim in the assertion message.
 */

type MessageValue = string | { [key: string]: MessageValue };
type MessageTree = { [key: string]: MessageValue };
type PathType = "string" | "object";

function collectPaths(
  tree: MessageTree,
  prefix = "",
  out: Map<string, PathType> = new Map()
): Map<string, PathType> {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      out.set(path, "object");
      collectPaths(value, path, out);
    } else {
      out.set(path, "string");
    }
  }
  return out;
}

const enPaths = collectPaths(en as MessageTree);

const otherLocales: Record<string, MessageTree> = {
  "pt-BR": ptBR as MessageTree,
  es: es as MessageTree,
};

describe("i18n message parity against en.json (canonical)", () => {
  it("en.json loaded with a non-trivial key set (fixture sanity)", () => {
    expect(enPaths.size).toBeGreaterThan(100);
  });

  for (const [locale, tree] of Object.entries(otherLocales)) {
    describe(`${locale}.json`, () => {
      const paths = collectPaths(tree);

      it("has every key path present in en.json", () => {
        const missing = [...enPaths.keys()].filter((p) => !paths.has(p));
        expect(
          missing,
          `${locale}.json is missing ${missing.length} key path(s) present in en.json:\n  ${missing.join("\n  ")}`
        ).toEqual([]);
      });

      it("has no key path absent from en.json", () => {
        const extra = [...paths.keys()].filter((p) => !enPaths.has(p));
        expect(
          extra,
          `${locale}.json has ${extra.length} key path(s) not present in en.json (remove or add to en.json):\n  ${extra.join("\n  ")}`
        ).toEqual([]);
      });

      it("agrees with en.json on the value type of every shared path", () => {
        const mismatched = [...paths.entries()]
          .filter(([p, type]) => enPaths.has(p) && enPaths.get(p) !== type)
          .map(
            ([p, type]) => `${p} (en: ${enPaths.get(p)}, ${locale}: ${type})`
          );
        expect(
          mismatched,
          `${locale}.json disagrees with en.json on value type for:\n  ${mismatched.join("\n  ")}`
        ).toEqual([]);
      });
    });
  }
});
