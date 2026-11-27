// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ProseBlock } from "@/app/[locale]/(platform)/courses/[slug]/lessons/[id]/blocks/prose-block";
import type { BlockContext } from "@/app/[locale]/(platform)/courses/[slug]/lessons/[id]/blocks/types";

describe("ProseBlock tables", () => {
  it("wraps a table in a keyboard-reachable scroll region", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProseBlock
          block={
            {
              _type: "prose",
              key: "p",
              src: "| a | b |\n| - | - |\n| 1 | 2 |\n",
            } as never
          }
          ctx={{ lessonNumber: null } as unknown as BlockContext}
        />
      </NextIntlClientProvider>
    );

    const region = screen.getByRole("region", {
      name: messages.lesson.tableScrollLabel,
    });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region.querySelector(":scope > table td")?.textContent).toBe("1");
  });
});
