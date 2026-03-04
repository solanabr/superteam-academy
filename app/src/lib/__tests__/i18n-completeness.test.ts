import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Load locale files relative to this test file
const MESSAGES_DIR = path.resolve(__dirname, "../../i18n/messages");

function loadJson(locale: string): Record<string, unknown> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

const en = loadJson("en");
const ptBR = loadJson("pt-BR");
const es = loadJson("es");

// Get all top-level namespace keys from a locale object
function topLevelKeys(locale: Record<string, unknown>): string[] {
  return Object.keys(locale);
}

// Recursively collect all leaf key paths (e.g. "common.loading", "challenge.hints.title")
function collectLeafPaths(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return [prefix];
  }
  const paths: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      paths.push(...collectLeafPaths(value, fullKey));
    } else {
      paths.push(fullKey);
    }
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Top-level namespace coverage
// ---------------------------------------------------------------------------

describe("i18n — top-level namespace coverage", () => {
  const enKeys = topLevelKeys(en);
  const ptBRKeys = topLevelKeys(ptBR);
  const esKeys = topLevelKeys(es);

  it("en.json has the same top-level namespaces as pt-BR.json", () => {
    const missing = enKeys.filter((k) => !ptBRKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("pt-BR.json has no extra top-level namespaces compared to en.json", () => {
    const extra = ptBRKeys.filter((k) => !enKeys.includes(k));
    expect(extra).toEqual([]);
  });

  it("en.json has the same top-level namespaces as es.json", () => {
    const missing = enKeys.filter((k) => !esKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("es.json has no extra top-level namespaces compared to en.json", () => {
    const extra = esKeys.filter((k) => !enKeys.includes(k));
    expect(extra).toEqual([]);
  });

  it("all three locales have the same number of top-level namespaces", () => {
    expect(ptBRKeys.length).toBe(enKeys.length);
    expect(esKeys.length).toBe(enKeys.length);
  });
});

// ---------------------------------------------------------------------------
// Key-count parity per namespace
// ---------------------------------------------------------------------------

describe("i18n — key counts are similar across locales", () => {
  // Allow up to 5% difference in leaf key count per locale.
  // Strict equality would fail if one locale has extra array entries in testimonials etc.
  const enPaths = collectLeafPaths(en);

  it("pt-BR.json has similar total leaf key count to en.json", () => {
    const ptBRPaths = collectLeafPaths(ptBR);
    const diff = Math.abs(enPaths.length - ptBRPaths.length);
    // Allow up to 10 keys difference (array testimonials may differ)
    expect(diff).toBeLessThanOrEqual(10);
  });

  it("es.json has similar total leaf key count to en.json", () => {
    const esPaths = collectLeafPaths(es);
    const diff = Math.abs(enPaths.length - esPaths.length);
    expect(diff).toBeLessThanOrEqual(10);
  });
});

// ---------------------------------------------------------------------------
// Critical namespaces must be present in all locales
// ---------------------------------------------------------------------------

describe("i18n — critical namespaces present in all locales", () => {
  const criticalNamespaces = [
    "common",
    "challenge",
    "courses",
    "dashboard",
    "leaderboard",
    "profile",
    "achievements",
    "errors",
    "nav",
  ];

  for (const ns of criticalNamespaces) {
    it(`namespace "${ns}" exists in all three locales`, () => {
      expect(en[ns]).toBeDefined();
      expect(ptBR[ns]).toBeDefined();
      expect(es[ns]).toBeDefined();
    });
  }
});

// ---------------------------------------------------------------------------
// challenge.hints namespace
// ---------------------------------------------------------------------------

describe("i18n — challenge.hints keys present in all locales", () => {
  const requiredHintKeys = [
    "title",
    "nudge",
    "approach",
    "solutionGuide",
    "getNextHint",
    "usedHints",
    "noMoreHints",
    "thinkFirst",
  ];

  function getHints(locale: Record<string, unknown>): Record<string, unknown> | undefined {
    const challenge = locale["challenge"] as Record<string, unknown> | undefined;
    return challenge?.["hints"] as Record<string, unknown> | undefined;
  }

  it("en.json has challenge.hints namespace", () => {
    expect(getHints(en)).toBeDefined();
  });

  it("pt-BR.json has challenge.hints namespace", () => {
    expect(getHints(ptBR)).toBeDefined();
  });

  it("es.json has challenge.hints namespace", () => {
    expect(getHints(es)).toBeDefined();
  });

  for (const key of requiredHintKeys) {
    it(`en.json challenge.hints.${key} is defined`, () => {
      expect(getHints(en)?.[key]).toBeDefined();
    });

    it(`pt-BR.json challenge.hints.${key} is defined`, () => {
      expect(getHints(ptBR)?.[key]).toBeDefined();
    });

    it(`es.json challenge.hints.${key} is defined`, () => {
      expect(getHints(es)?.[key]).toBeDefined();
    });
  }
});
