import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";

/**
 * Recursively collect all keys from an object using dot-notation.
 */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

const enKeys = collectKeys(en);
const esKeys = collectKeys(es);
const ptBRKeys = collectKeys(ptBR);

describe("i18n translation completeness", () => {
  it("en.json has translations", () => {
    expect(enKeys.length).toBeGreaterThan(0);
  });

  it("es.json has all keys from en.json", () => {
    const missing = enKeys.filter((k) => !esKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("pt-BR.json has all keys from en.json", () => {
    const missing = enKeys.filter((k) => !ptBRKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("es.json does not have extra keys beyond en.json", () => {
    const extra = esKeys.filter((k) => !enKeys.includes(k));
    expect(extra).toEqual([]);
  });

  it("pt-BR.json does not have extra keys beyond en.json", () => {
    const extra = ptBRKeys.filter((k) => !enKeys.includes(k));
    expect(extra).toEqual([]);
  });

  it("no empty string values in en.json", () => {
    const empty = enKeys.filter((k) => {
      const parts = k.split(".");
      let val: unknown = en;
      for (const p of parts) val = (val as Record<string, unknown>)[p];
      return val === "";
    });
    expect(empty).toEqual([]);
  });
});
