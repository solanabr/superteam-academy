import { describe, it, expect } from "vitest";
import { parseProgramError } from "../program-errors";
import idl from "../idl/superteam_academy.json";
import en from "../../../messages/en.json";
import ptBR from "../../../messages/pt-BR.json";
import es from "../../../messages/es.json";

const idlErrors = (idl as { errors: { code: number; name: string }[] }).errors;
const locales = { en, "pt-BR": ptBR, es } as const;

/** Format a custom program error string the way RPC simulation surfaces it. */
const hex = (code: number) => `custom program error: 0x${code.toString(16)}`;

describe("parseProgramError — newly added codes (6031–6036)", () => {
  const added: [number, string, string][] = [
    [6031, "MintingPaused", "mintingPaused"],
    [6032, "WrongXpMint", "wrongXpMint"],
    [6033, "XpAmountExceedsMax", "xpAmountExceedsMax"],
    [6034, "StaleEnrollment", "staleEnrollment"],
    [6035, "OldMinterRoleMissing", "oldMinterRoleMissing"],
    [6036, "EnrollmentInProgress", "enrollmentInProgress"],
  ];

  it.each(added)("maps hex code for %i → %s", (code, name, i18nKey) => {
    const parsed = parseProgramError(new Error(hex(code)));
    expect(parsed.code).toBe(code);
    expect(parsed.name).toBe(name);
    expect(parsed.i18nKey).toBe(i18nKey);
    expect(parsed.fallback.length).toBeGreaterThan(0);
    expect(parsed.fallback).not.toContain("0x");
  });

  it.each(added)("maps error name for %i (%s)", (_code, name, i18nKey) => {
    const parsed = parseProgramError(new Error(`Something failed: ${name}`));
    expect(parsed.name).toBe(name);
    expect(parsed.i18nKey).toBe(i18nKey);
  });
});

describe("parseProgramError — unknown-code fallback", () => {
  it("preserves an unmapped custom code and returns the raw message", () => {
    const parsed = parseProgramError(new Error("custom program error: 0x270f")); // 9999
    expect(parsed.code).toBe(9999);
    expect(parsed.name).toBeNull();
    expect(parsed.i18nKey).toBeNull();
    expect(parsed.fallback).toContain("0x270f");
  });

  it("returns the raw message when nothing matches", () => {
    const parsed = parseProgramError(new Error("blockhash not found"));
    expect(parsed.code).toBeNull();
    expect(parsed.name).toBeNull();
    expect(parsed.i18nKey).toBeNull();
    expect(parsed.fallback).toBe("blockhash not found");
  });
});

describe("parseProgramError — existing mappings unchanged", () => {
  it.each([
    [6008, "UnenrollCooldown", "unenrollCooldown"],
    [6000, "Unauthorized", "unauthorized"],
    [6030, "InvalidCourseAccount", "invalidCourseAccount"],
  ])("code %i still maps to %s", (code, name, i18nKey) => {
    const parsed = parseProgramError(new Error(hex(code)));
    expect(parsed.name).toBe(name);
    expect(parsed.i18nKey).toBe(i18nKey);
  });
});

describe("program-errors ↔ IDL ↔ i18n parity", () => {
  it("every IDL error code resolves to a mapped entry", () => {
    for (const { code, name } of idlErrors) {
      const parsed = parseProgramError(new Error(hex(code)));
      expect(parsed.name, `code ${code} (${name}) is unmapped`).toBe(name);
      expect(
        parsed.i18nKey,
        `code ${code} (${name}) has no i18nKey`
      ).not.toBeNull();
    }
  });

  it("every mapped i18nKey has a string in all three locales", () => {
    for (const { code } of idlErrors) {
      const { i18nKey } = parseProgramError(new Error(hex(code)));
      if (!i18nKey) continue;
      for (const [name, msgs] of Object.entries(locales)) {
        const value = (msgs as { programErrors: Record<string, string> })
          .programErrors[i18nKey];
        expect(
          typeof value === "string" && value.length > 0,
          `${name} is missing programErrors.${i18nKey}`
        ).toBe(true);
      }
    }
  });
});
