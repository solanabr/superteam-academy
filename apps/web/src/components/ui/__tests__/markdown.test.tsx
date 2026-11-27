// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act } from "react";
import { Markdown, MAX_MARKDOWN_DEPTH } from "@/components/ui/markdown";

afterEach(cleanup);

function html(src: string) {
  return render(<Markdown>{src}</Markdown>).container;
}

function lessonHtml(src: string) {
  return render(<Markdown dropComments>{src}</Markdown>).container;
}

function domDepth(root: Element): number {
  let deepest = 0;
  const stack: [Element, number][] = [[root, 0]];
  while (stack.length) {
    const [el, depth] = stack.pop()!;
    deepest = Math.max(deepest, depth);
    for (const child of el.children) stack.push([child, depth + 1]);
  }
  return deepest;
}

describe("Markdown", () => {
  it.each([
    ["script", "<script>window.x = 1</script>", "script"],
    [
      "external script",
      '<script src="https://a.test/x.js"></script>',
      "script",
    ],
    ["iframe", '<iframe src="https://a.test"></iframe>', "iframe"],
    [
      "form",
      '<form action="/x" method="post"><button>go</button></form>',
      "form",
    ],
    ["style", "<style>body{display:none}</style>", "style"],
    ["link", '<link rel="stylesheet" href="https://a.test/x.css">', "link"],
    ["details", "<details><summary>s</summary>b</details>", "details"],
    ["image", '<img src="https://a.test/x.png" onerror="x()">', "img"],
    ["inline span", 'a <span class="x" style="color:red">b</span> c', "span"],
  ])("does not turn raw %s into an element", (_name, src, tag) => {
    const c = html(src);
    expect(c.querySelector(tag)).toBeNull();
  });

  it("shows raw tags as the text the author wrote", () => {
    const c = html("<details>more</details>");
    expect(c.textContent).toContain("<details>");
  });

  it("keeps a generic written outside backticks readable", () => {
    const c = html("# Your Account<T> is slow");
    expect(c.querySelector("h1")?.textContent).toBe("Your Account<T> is slow");
    expect(c.querySelector("t")).toBeNull();
  });

  it("removes script URLs from links and images", () => {
    const c = html("[a](javascript:alert(1)) ![b](javascript:alert(2))");
    expect(c.querySelector("a")?.getAttribute("href")).toBe("");
    expect(c.querySelector("img")?.getAttribute("src")).toBe("");
  });

  it("renders GFM tables with their alignment", () => {
    const c = html("| a | b |\n| :-- | --: |\n| 1 | 2 |\n");
    expect(c.querySelectorAll("table thead th")).toHaveLength(2);
    expect(c.querySelector("table tbody td")?.textContent).toBe("1");
    expect(c.querySelector("th")?.getAttribute("style")).toMatch(/left/);
  });

  it("highlights fenced code and leaves tags inside it as code", () => {
    const c = html("```ts\nconst a: Array<string> = [];\n```\n");
    const code = c.querySelector("pre code");
    expect(code?.className).toMatch(/hljs/);
    expect(code?.className).toMatch(/language-ts/);
    expect(code?.querySelector("[class*=hljs-]")).not.toBeNull();
    expect(code?.textContent).toContain("Array<string>");
  });

  it("renders images and links", () => {
    const c = html("![alt](https://a.test/x.png) [t](https://a.test/y)");
    expect(c.querySelector("img")?.getAttribute("src")).toBe(
      "https://a.test/x.png"
    );
    expect(c.querySelector("img")?.getAttribute("alt")).toBe("alt");
    expect(c.querySelector("a")?.getAttribute("href")).toBe("https://a.test/y");
  });

  it("renders through the components it is given", () => {
    const { container } = render(
      <Markdown components={{ h2: () => <p data-testid="own">swapped</p> }}>
        {"## heading"}
      </Markdown>
    );
    expect(container.querySelector("h2")).toBeNull();
    expect(container.querySelector("[data-testid=own]")).not.toBeNull();
  });
});

describe("Markdown comments in community text", () => {
  it("shows a comment-only post as the text the author wrote", () => {
    const c = html("<!-- text -->");
    expect(c.textContent).toContain("<!-- text -->");
  });

  it("shows inline comments as well", () => {
    expect(html("a <!-- b --> c").textContent).toBe("a <!-- b --> c");
  });

  it("does not let markup hide behind a comment on the same line", () => {
    const c = html("<!-- note --><iframe></iframe>");
    expect(c.querySelector("iframe")).toBeNull();
    expect(c.textContent).toContain("<iframe>");
  });

  it("does not let markup hide between two comments on a line", () => {
    const c = html("<!-- a --><iframe></iframe><!-- b -->");
    expect(c.querySelector("iframe")).toBeNull();
    expect(c.textContent).toContain("<iframe>");
  });
});

describe("Markdown comments in lessons", () => {
  it("drops comments, block and inline, instead of showing them", () => {
    const c = lessonHtml(
      "<!-- verify: note -->\n\nbefore <!-- inline --> after\n"
    );
    expect(c.textContent).not.toContain("verify");
    expect(c.textContent).not.toContain("inline");
    expect(c.textContent).toContain("before");
    expect(c.textContent).toContain("after");
  });

  it.each([
    ["one space", " <!-- a -->"],
    ["two spaces", "  <!-- a -->"],
    ["three spaces", "   <!-- a -->"],
    ["two on a line", "<!-- a --> <!-- a -->"],
    ["two with no gap", "<!-- a --><!-- a -->"],
    ["trailing spaces", "<!-- a -->   "],
    ["over lines", "  <!-- a\n  a\n  a --> <!-- a -->"],
    ["in a blockquote", ">   <!-- a -->"],
    ["in a list", "- <!-- a --> <!-- a -->"],
    ["in a table cell", "| h |\n| - |\n| x <!-- a --> |"],
  ])("drops a comment: %s", (_name, src) => {
    const c = lessonHtml(`before\n\n${src}\n\nafter\n`);
    expect(c.textContent).not.toContain("<!--");
    expect(c.textContent).not.toMatch(/\ba\b/);
    expect(c.textContent).toContain("before");
    expect(c.textContent).toContain("after");
  });

  it("keeps text after a comment as a paragraph, comment gone", () => {
    const c = lessonHtml("<!-- a --> trailing");
    expect(c.querySelector("p")?.textContent).toBe("trailing");
    expect(c.textContent).toBe("trailing");
  });

  it("keeps the text after a comment unparsed, as CommonMark's HTML block does", () => {
    const c = lessonHtml("<!-- a --> **b** [c](https://d.e)");
    expect(c.querySelector("strong")).toBeNull();
    expect(c.querySelector("a")).toBeNull();
    expect(c.textContent).toBe("**b** [c](https://d.e)");
  });

  it.each([
    ["behind a comment", "<!-- note --><iframe></iframe>", "iframe"],
    ["between comments", "<!-- a --><iframe></iframe><!-- b -->", "iframe"],
    ["behind an indented comment", "  <!-- a --><script>x</script>", "script"],
    ["inside a comment gap", "<scr<!-- a -->ipt>x</script>", "script"],
    ["split by a comment", "<ifr<!-- a -->ame></iframe>", "iframe"],
    ["in a block with a comment", "<div>\n<!-- a -->\n</div>", "div"],
    ["with an attribute", "<!-- a --><img src=x onerror=y>", "img"],
  ])("does not let markup through: %s", (_name, src, tag) => {
    const c = lessonHtml(src);
    expect(c.querySelector(tag)).toBeNull();
    expect(c.textContent).toContain("<");
  });

  it("leaves an unterminated comment as literal text", () => {
    expect(lessonHtml("<!-- a").textContent).toBe("<!-- a");
  });

  it("leaves a comment in code alone", () => {
    const c = lessonHtml(
      "`<!-- a -->`\n\n    <!-- b -->\n\n```\n<!-- c -->\n```"
    );
    expect(c.textContent).toContain("<!-- a -->");
    expect(c.textContent).toContain("<!-- b -->");
    expect(c.textContent).toContain("<!-- c -->");
  });

  it("leaves raw markup with no comment exactly as it was", () => {
    const same = "  <details>more</details>";
    expect(lessonHtml(same).innerHTML).toBe(
      render(<Markdown>{same}</Markdown>).container.innerHTML
    );
  });
});

/** Every shape fits the 10,000-character limit community posts are held to. */
const DEEP = {
  "blockquotes, 2000": `${"> ".repeat(2000)}x`,
  "blockquotes, 4000": `${"> ".repeat(4000)}x`,
  "10,000 >": ">".repeat(10000),
  bullets: `${"- ".repeat(4900)}x`,
  "ordered items": `${"1. ".repeat(3300)}x`,
  "quoted bullets": `${"> - ".repeat(2400)}x`,
  "bullets over lines": Array.from(
    { length: 95 },
    (_, i) => `${" ".repeat(i * 2)}- a`
  ).join("\n"),
  "footnote body": `[^a]\n\n[^a]: ${"> ".repeat(2400)}x`,
  "nested footnotes": `[^a]\n\n${"[^a]: ".repeat(1600)}x`,
} as const;

/** Heavy inline runs. They may render or fall back, but never throw. */
const HEAVY = {
  "nested emphasis": `${"*".repeat(4900)}x${"*".repeat(4900)}`,
  "nested underscores": `${"_".repeat(4900)}x${"_".repeat(4900)}`,
  "alternating emphasis": `${"*a **b ".repeat(700)}x${"** *".repeat(700)}`,
  strikethrough: `${"~~a ".repeat(1200)}x${" a~~".repeat(1200)}`,
  "nested links": `${"[".repeat(1900)}x${"](u)".repeat(1900)}`,
  "nested images": `${"![".repeat(1600)}x${"](u)".repeat(1600)}`,
  "block tags": "<div>".repeat(2000),
  "inline tags": `a ${"<b>".repeat(3000)}`,
  "open comments": "<!--".repeat(2500),
  backticks: "`".repeat(10000),
  headings: "# ".repeat(4900),
  pipes: "|".repeat(10000),
} as const;

describe("Markdown under deep or heavy input", () => {
  it.each(Object.entries(DEEP))("contains %s", (_name, src) => {
    const c = html(src);
    expect(c.querySelector("blockquote, ul, ol")).toBeNull();
    expect(c.textContent).toBe(src);
  });

  it.each(Object.entries(DEEP))("contains %s on the server", (_name, src) => {
    const out = renderToString(<Markdown>{src}</Markdown>);
    expect(out).not.toMatch(/<(blockquote|ul|ol)\b/);
    expect(out.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(HEAVY))("survives %s", (_name, src) => {
    const c = html(src);
    expect(domDepth(c)).toBeLessThanOrEqual(2 * MAX_MARKDOWN_DEPTH);
    expect(renderToString(<Markdown>{src}</Markdown>).length).toBeGreaterThan(
      0
    );
  });

  it("renders Markdown right up to the depth cap, on the client and the server", () => {
    const src = `${"> ".repeat(MAX_MARKDOWN_DEPTH - 1)}x`;
    const c = html(src);
    expect(c.querySelectorAll("blockquote")).toHaveLength(
      MAX_MARKDOWN_DEPTH - 1
    );
    expect(
      renderToString(<Markdown>{src}</Markdown>).match(/<blockquote>/g)
    ).toHaveLength(MAX_MARKDOWN_DEPTH - 1);
  });

  it("falls back to plain text one level past the cap", () => {
    const src = `${"> ".repeat(MAX_MARKDOWN_DEPTH)}x`;
    const c = html(src);
    expect(c.querySelector("blockquote")).toBeNull();
    expect(c.textContent).toBe(src);
  });

  it("gets the same fallback from a shape the source scan can't see", () => {
    // Inline nesting only shows up after the parse.
    const src = `${"*a _b ".repeat(MAX_MARKDOWN_DEPTH)}x${"_*".repeat(MAX_MARKDOWN_DEPTH)}`;
    const c = html(src);
    expect(c.querySelector("em")).toBeNull();
    expect(c.textContent).toBe(src);
  });

  it.each([
    ["bullets", DEEP.bullets],
    ["nested emphasis", HEAVY["nested emphasis"]],
    ["alternating emphasis", HEAVY["alternating emphasis"]],
    ["nested images", HEAVY["nested images"]],
  ])("doesn't parse %s at all, so they can't stall the page", (_name, src) => {
    const started = performance.now();
    const c = html(src);
    // Parsing these takes seconds to minutes; the scan takes a millisecond.
    expect(performance.now() - started).toBeLessThan(2000);
    expect(c.textContent).toBe(src);
  });

  it("still parses dense snake_case code that's nowhere near the limit", () => {
    const line = "let some_long_name = other_long_name[index_value];\n";
    const c = html(`\`\`\`rust\n${line.repeat(120)}\`\`\`\n`);
    expect(c.querySelector("pre code.hljs")).not.toBeNull();
  });

  it("does not mistake a spaced rule or real content for deep nesting", () => {
    const rule = html(Array(80).fill("-").join(" "));
    expect(rule.querySelector("hr")).not.toBeNull();
    const dashes = html(`text\n\n${"-".repeat(200)}\n`);
    expect(dashes.querySelector("hr")).not.toBeNull();
  });

  it("keeps the post beside a bad one rendering", () => {
    const { container } = render(
      <>
        <section data-testid="bad">
          <Markdown>{DEEP["blockquotes, 2000"]}</Markdown>
        </section>
        <section data-testid="good">
          <Markdown>{"**fine**"}</Markdown>
        </section>
      </>
    );
    expect(
      container.querySelector("[data-testid=good] strong")?.textContent
    ).toBe("fine");
    expect(container.querySelector("[data-testid=bad]")?.textContent).toBe(
      DEEP["blockquotes, 2000"]
    );
  });

  it("does not leak a comment through the lesson fallback", () => {
    const c = lessonHtml(`<!-- note -->\n\n${"> ".repeat(2000)}x`);
    expect(c.textContent).not.toContain("note");
    expect(c.textContent).toContain("> > x");
  });

  it("wraps long unbroken fallback text instead of widening the page", () => {
    const c = html(">".repeat(10000));
    expect(c.firstElementChild?.className).toMatch(/whitespace-pre-wrap/);
    expect(c.firstElementChild?.className).toMatch(/break-words/);
  });

  it("hydrates the fallback with no mismatch", async () => {
    const src = DEEP["blockquotes, 2000"];
    const host = document.createElement("div");
    host.innerHTML = renderToString(<Markdown>{src}</Markdown>);
    const errors: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...a) => {
      errors.push(a);
    });
    let root: Root;
    await act(async () => {
      root = hydrateRoot(host, <Markdown>{src}</Markdown>, {
        onRecoverableError: (e) => errors.push(e),
      });
    });
    await act(async () => root.unmount());
    spy.mockRestore();
    expect(errors).toEqual([]);
  });

  it("falls back when a custom component throws, and recovers on new text", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const components = {
      h2: (): never => {
        throw new Error("boom");
      },
    };
    const { container, rerender } = render(
      <Markdown components={components}>{"## heading"}</Markdown>
    );
    expect(container.textContent).toBe("## heading");
    rerender(<Markdown components={components}>{"**fine**"}</Markdown>);
    expect(container.querySelector("strong")?.textContent).toBe("fine");
    spy.mockRestore();
  });
});

describe("one Markdown pipeline", () => {
  const SRC = join(__dirname, "..", "..", "..");
  const SHARED = join("components", "ui", "markdown.tsx");

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const abs = join(dir, entry);
      if (statSync(abs).isDirectory()) {
        return entry === "__tests__" || entry === "generated"
          ? []
          : sourceFiles(abs);
      }
      return /\.[cm]?[jt]sx?$/.test(entry) ? [abs] : [];
    });
  }

  /** Static, side-effect and dynamic imports and `require`, subpaths included. */
  const LOADS_THE_PIPELINE =
    /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire(?:\.resolve)?\s*\(\s*)["'`](?:react-markdown|rehype-[\w-]+|remark-[\w-]+)(?:\/[^"'`]*)?["'`]/;

  it.each([
    'import ReactMarkdown from "react-markdown";',
    "import { x } from 'remark-gfm'",
    'import "rehype-raw";',
    'const m = await import("react-markdown");',
    "const m = import( 'react-markdown' );",
    'const r = require("rehype-raw");',
    "const r = require( 'remark-gfm/lib' );",
    'const r = require.resolve("rehype-raw");',
    "const m = import(`rehype-raw`);",
    'export { default } from "react-markdown";',
  ])("recognizes %s", (line) => {
    expect(LOADS_THE_PIPELINE.test(line)).toBe(true);
  });

  it.each([
    'import { Markdown } from "@/components/ui/markdown";',
    'const name = "react-markdown";',
    'import x from "not-react-markdown";',
    "// mentions rehype-raw in a comment",
  ])("does not flag %s", (line) => {
    expect(LOADS_THE_PIPELINE.test(line)).toBe(false);
  });

  it("is the only module loading the renderer or its plugins", () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => relative(SRC, f) !== SHARED)
      .filter((f) => LOADS_THE_PIPELINE.test(readFileSync(f, "utf8")))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });
});
