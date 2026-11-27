import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate24-raw-html";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
sourceLocale: en
xpPerLesson: 10
xpReward: 100
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;

const slots = JSON.stringify({
  version: 1,
  slots: { "lesson-a": 0 },
  retired: [],
  next: 1,
});

const lesson = `id: lesson-a
slug: a
title: A
skills: [general]
blocks: [{ type: prose, key: intro, src: intro.md }]
`;

function repo(intro: string, extra: Record<string, string> = {}): string {
  return makeTempRepo({
    "courses/x/course.yaml": course,
    "courses/x/slots.lock.json": slots,
    "courses/x/lessons/a/lesson.yaml": lesson,
    "courses/x/lessons/a/intro.md": intro,
    ...extra,
  });
}

async function gate24(root: string) {
  const r = await runLint(root);
  return r.diagnostics.filter((d) => d.gate === "gate-24");
}

describe("gate 24 — raw HTML in learner prose", () => {
  it("flags a block tag with its file, line and tag", async () => {
    const out = await gate24(repo("# a\n\n<details>\nhi\n</details>\n"));
    expect(out).toHaveLength(1);
    expect(out[0]?.file).toBe("courses/x/lessons/a/intro.md");
    expect(out[0]?.message).toMatch(/line 3/);
    expect(out[0]?.message).toMatch(/<details>/);
  });

  it("flags inline tags, including a generic written outside backticks", async () => {
    const out = await gate24(
      repo("# Your Account<T> path\n\nA <kbd>k</kbd>\n")
    );
    const text = out.map((d) => d.message).join("\n");
    expect(text).toMatch(/<T>/);
    expect(text).toMatch(/<kbd>/);
    expect(text).toMatch(/line 1/);
    expect(text).toMatch(/line 3/);
  });

  it("flags a tag inside a table cell", async () => {
    const out = await gate24(repo("| a |\n| - |\n| b<br>c |\n"));
    expect(out.map((d) => d.message).join()).toMatch(/<br>/);
  });

  it("is a warning, so the catalog's known entries don't fail the build", async () => {
    const root = repo("<div>x</div>\n");
    const out = await gate24(root);
    expect(out.every((d) => d.severity === "warning")).toBe(true);
    expect((await runLint(root)).diagnostics.map((d) => d.gate)).toContain(
      "gate-24"
    );
  });

  it("exempts fenced, tilde-fenced, indented and inline code", async () => {
    const md = [
      "# a",
      "",
      "```html",
      "<div><script>x</script></div>",
      "```",
      "",
      "~~~",
      "<iframe></iframe>",
      "~~~",
      "",
      "    <table></table>",
      "",
      "Use `Account<T>` and ``<b>`` here.",
      "",
    ].join("\n");
    expect(await gate24(repo(md))).toEqual([]);
  });

  it("exempts a fence inside a list or blockquote", async () => {
    const md =
      "- item\n\n  ```html\n  <div></div>\n  ```\n\n> ```\n> <b></b>\n> ```\n";
    expect(await gate24(repo(md))).toEqual([]);
  });

  it("exempts autolinks and escaped angle brackets", async () => {
    const md = "See <https://example.com> and Account\\<T\\> or a &lt;b&gt;.\n";
    expect(await gate24(repo(md))).toEqual([]);
  });

  it("exempts a comment, which the renderer drops", async () => {
    const md =
      "<!-- verify: expect-fail a note -->\n\nText <!-- inline --> here.\n";
    expect(await gate24(repo(md))).toEqual([]);
  });

  it.each([
    ["indented one space", " <!-- a -->\n"],
    ["indented two spaces", "  <!-- a -->\n"],
    ["indented three spaces", "   <!-- a -->\n"],
    ["two on a line", "<!-- a --> <!-- b -->\n"],
    ["two with no gap", "<!-- a --><!-- b -->\n"],
    ["over lines and indented", "  <!-- a\n  b -->\n"],
    ["in a blockquote", ">  <!-- a --> <!-- b -->\n"],
  ])("exempts a comment %s, which the renderer drops", async (_name, md) => {
    expect(await gate24(repo(md))).toEqual([]);
  });

  it("names the text after a comment, which shows on the page unparsed", async () => {
    const out = await gate24(repo("<!-- a --> trailing\n"));
    expect(out).toHaveLength(1);
    expect(out[0]?.message).toMatch(/`trailing`/);
  });

  it.each([
    ["<!-- a --> <!-- b --> x\n", "`x`"],
    ["  <!-- a --> <b>y</b>\n", "`<b>`"],
    ["<!-- a\n\nnever closed\n", "`<!-- a`"],
    ["<!-- <b> --> x\n", "`x`"],
  ])("labels %j with something real", async (md, expected) => {
    const out = await gate24(repo(md));
    expect(out).toHaveLength(1);
    expect(out[0]?.message).toContain(expected);
    expect(out[0]?.message).not.toContain("``");
  });

  it("flags markup sharing a line with a comment", async () => {
    const out = await gate24(repo("<!-- note --><div>x</div>\n"));
    expect(out).toHaveLength(1);
    expect(out[0]?.message).toMatch(/<div>/);
  });

  it("flags markup between two comments on one line", async () => {
    const out = await gate24(repo("<!-- a --><div>x</div><!-- b -->\n"));
    expect(out).toHaveLength(1);
    expect(out[0]?.message).toMatch(/<div>/);
  });

  it("lints a translated overlay's prose", async () => {
    const out = await gate24(
      repo("# a\n", {
        "courses/x/l10n/es/lessons/a/intro.md": "# a\n\n<span>hola</span>\n",
      })
    );
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((d) => d.file.includes("/l10n/es/"))).toBe(true);
  });

  it("ignores parked drafts and markdown that is not lesson prose", async () => {
    const out = await gate24(
      repo("# a\n", {
        "README.md": "<div>not prose</div>\n",
        "courses/x/l10n/es/_draft/lessons/a/intro.md": "<div>parked</div>\n",
        "courses/x/l10n/es/NOTES.md": "<div>not shipped</div>\n",
      })
    );
    expect(out).toEqual([]);
  });

  it("stays quiet on clean prose", async () => {
    expect(await gate24(repo("# a\n\n**b** [c](https://d.e)\n"))).toEqual([]);
  });
});
