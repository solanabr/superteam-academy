// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { TestOutChallenge } from "../test-out-challenge";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/analytics/events", () => ({
  trackTestOutStarted: vi.fn(),
  trackTestOutGraded: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TestOutChallenge question text", () => {
  it("renders authored backticks as inline code, and nothing else as markup", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          courseId: "c",
          count: 1,
          passRatio: 0.5,
          questions: [
            {
              id: "q1",
              prompt: "What does `commitment` set?",
              multiSelect: false,
              options: [
                { id: "a", label: "`processed` [docs](https://example.com)" },
              ],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TestOutChallenge courseId="c" locale="en" />
      </NextIntlClientProvider>
    );
    await waitFor(() => expect(screen.getByRole("radio")).toBeInTheDocument());
    expect(
      [...container.querySelectorAll("code")].map((code) => code.textContent)
    ).toEqual(["commitment", "processed"]);
    expect(container.querySelector("label a")).toBeNull();
  });
});
