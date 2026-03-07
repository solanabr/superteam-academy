import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("frontend authenticity and theme wiring", () => {
  it("uses class-based theme switching for the global theme provider", () => {
    const source = readSource("src", "components", "layout", "theme-provider.tsx");

    expect(source).toContain('attribute="class"');
  });

  it("does not ship fabricated landing page metrics or fake progress", () => {
    const source = readSource("src", "app", "[locale]", "page.tsx");

    expect(source).not.toContain("2,500+");
    expect(source).not.toContain("15+");
    expect(source).not.toContain("800+");
    expect(source).not.toContain("L12");
    expect(source).not.toContain('>3 {tc("lessons")}<');
  });

  it("does not force DevLab into dark mode from the page entrypoint", () => {
    const source = readSource("src", "app", "[locale]", "devlab", "page.tsx");

    expect(source).not.toContain('classList.add("dark")');
    expect(source).toContain("bg-background");
    expect(source).toContain("dark:bg-[#11131d]");
  });

  it("does not ship fake user skill arrays into jobs and ideas pages", () => {
    const jobsSource = readSource("src", "app", "[locale]", "jobs", "page.tsx");
    const jobDetailSource = readSource("src", "app", "[locale]", "jobs", "[id]", "page.tsx");
    const ideasSource = readSource("src", "app", "[locale]", "ideas", "page.tsx");
    const ideaDetailSource = readSource("src", "app", "[locale]", "ideas", "[id]", "page.tsx");

    expect(jobsSource).not.toContain("mockUserSkills");
    expect(jobDetailSource).not.toContain("mockUserSkills");
    expect(ideasSource).not.toContain("mockUserSkills");
    expect(ideaDetailSource).not.toContain("mockUserSkills");
  });

  it("does not invent extra job detail content that is not present in the API model", () => {
    const source = readSource("src", "app", "[locale]", "jobs", "[id]", "page.tsx");

    expect(source).not.toContain("Builder profile sourced from the Superteam Academy job marketplace");
    expect(source).not.toContain("requirementSeed");
    expect(source).not.toContain("Remote-friendly collaboration");
  });
});
