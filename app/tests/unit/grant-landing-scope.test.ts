import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("grant landing scope", () => {
  it("includes social proof, ecosystem logos, and newsletter signup on the landing page", () => {
    const source = readSource("src", "app", "[locale]", "page.tsx");

    expect(source).toContain("testimonialTitle");
    expect(source).toContain("newsletter");
    expect(source).toContain("ecosystem");
  });

  it("backs newsletter signup with a real API route", () => {
    const routePath = join(process.cwd(), "src", "app", "api", "newsletter", "route.ts");

    expect(existsSync(routePath)).toBe(true);

    const source = readFileSync(routePath, "utf8");
    expect(source).toContain("z.string().email()");
    expect(source).toContain("prisma");
  });

  it("does not use generic footer social links", () => {
    const source = readSource("src", "components", "layout", "footer.tsx");

    expect(source).not.toContain('href="https://github.com"');
    expect(source).not.toContain('href="https://twitter.com"');
    expect(source).toContain("solanabr/superteam-academy");
    expect(source).toContain("SuperteamBR");
  });
});
