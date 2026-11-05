// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Lesson } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { ProseBlock } from "@/app/[locale]/(platform)/courses/[slug]/lessons/[id]/blocks/prose-block";
import type { BlockContext } from "@/app/[locale]/(platform)/courses/[slug]/lessons/[id]/blocks/types";

function renderProse(src: string, title = "Hash everything") {
  const ctx = {
    lesson: { _id: "l", title, slug: "l", blocks: [] } as unknown as Lesson,
    lessonNumber: 2,
  } as unknown as BlockContext;
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProseBlock
        block={{ _type: "prose", key: "p", src } as never}
        ctx={ctx}
      />
    </NextIntlClientProvider>
  ).container;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ProseBlock markdown", () => {
  it("does not create elements from raw HTML", () => {
    const c = renderProse(
      '<script src="https://a.test/x.js"></script>\n\n<form action="/x"><button>go</button></form>\n\n<iframe src="https://a.test"></iframe>\n'
    );
    expect(c.querySelector("script, form, iframe")).toBeNull();
  });

  it("numbers a title carrying a generic and shows it in full", () => {
    const title = "Your Account<T> is slow";
    const c = renderProse(`# ${title}\n`, title);
    expect(c.querySelector("h1")?.textContent).toBe(`2. ${title}`);
  });

  it("keeps the number on a plain title and leaves other h1s alone", () => {
    const c = renderProse("# Hash everything\n\n# Another\n");
    const [first, second] = c.querySelectorAll("h1");
    expect(first?.textContent).toBe("2. Hash everything");
    expect(second?.textContent).toBe("Another");
  });

  it("keeps the copy button on code blocks", () => {
    const c = renderProse("```rust\nfn main() {}\n```\n");
    expect(c.querySelector("pre code.hljs")).not.toBeNull();
    expect(c.querySelector("pre + button")?.getAttribute("aria-label")).toBe(
      "Copy code"
    );
  });

  it("keeps the version stamp chip and plain blockquotes", () => {
    const c = renderProse("> Version stamp: anchor 1.0\n\n> A quote\n");
    expect(c.querySelectorAll("blockquote")).toHaveLength(1);
    expect(
      c.querySelector("[aria-label='Version stamp']")?.textContent
    ).toMatch(/anchor 1\.0/);
  });
});
