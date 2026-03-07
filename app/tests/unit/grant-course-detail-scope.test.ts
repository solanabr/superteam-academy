import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("grant course detail scope", () => {
  it("does not use the generic app name as the course instructor", () => {
    const source = readSource("src", "app", "[locale]", "courses", "[slug]", "page.tsx");

    expect(source).not.toContain('{tc("appName")}');
  });

  it("includes a reviews section and wallet-enrollment guidance", () => {
    const source = readSource("src", "app", "[locale]", "courses", "[slug]", "page.tsx");

    expect(source).toContain('t("reviews")');
    expect(source).toContain("wallet");
    expect(source).toContain("sign");
  });
});
