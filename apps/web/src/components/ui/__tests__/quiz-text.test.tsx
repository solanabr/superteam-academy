// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { QuizText, splitInlineCode } from "../quiz-text";

const code = (text: string) => ({ code: true, text });
const plain = (text: string) => ({ code: false, text });

describe("splitInlineCode", () => {
  it.each([
    ["no backticks", "just text", [plain("just text")]],
    ["one span", "a `b` c", [plain("a "), code("b"), plain(" c")]],
    ["leading and trailing", "`a` `b`", [code("a"), plain(" "), code("b")]],
    ["an unpaired backtick", "a ` b", [plain("a ` b")]],
    ["a pair after a stray run", "`` a `b`", [plain("`` a "), code("b")]],
    ["a backtick inside code", "``a`b``", [code("a`b")]],
    ["padding around a backtick", "`` `a` ``", [code("`a`")]],
    ["all spaces", "`  `", [code("  ")]],
    ["an empty string", "", []],
  ])("%s", (_name, text, parts) => {
    expect(splitInlineCode(text)).toEqual(parts);
  });
});

describe("QuizText", () => {
  it.each([
    "# heading",
    "1. item",
    "- item",
    "[link](https://example.com)",
    "![image](https://example.com/x.png)",
    "<b>bold</b>",
    "*em* and **strong**",
    "https://example.com",
  ])("keeps %s as the characters typed, beside code too", (text) => {
    const { container } = render(<QuizText>{`${text} \`code\``}</QuizText>);
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe("CODE");
    expect(container.textContent).toBe(`${text} code`);
  });
});
