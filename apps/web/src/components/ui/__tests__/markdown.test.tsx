// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Markdown } from "@/components/ui/markdown";

afterEach(cleanup);

function html(src: string) {
  return render(<Markdown>{src}</Markdown>).container;
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

  it("drops comments, block and inline, instead of showing them", () => {
    const c = html("<!-- verify: note -->\n\nbefore <!-- inline --> after\n");
    expect(c.textContent).not.toContain("verify");
    expect(c.textContent).not.toContain("inline");
    expect(c.textContent).toContain("before");
    expect(c.textContent).toContain("after");
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
      return /\.tsx?$/.test(entry) ? [abs] : [];
    });
  }

  it("is the only module importing the renderer or its plugins", () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => relative(SRC, f) !== SHARED)
      .filter((f) =>
        /from\s+["'](react-markdown|rehype-[\w-]+|remark-[\w-]+)["']/.test(
          readFileSync(f, "utf8")
        )
      )
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });
});
