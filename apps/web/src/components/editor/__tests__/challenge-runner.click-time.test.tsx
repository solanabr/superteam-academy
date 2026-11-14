// @vitest-environment jsdom
// The editor's text runs ahead of React's copy, so Run asks for the code when
// it's clicked instead of taking whatever the last render handed it.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ChallengeRunner } from "../challenge-runner";

const h = vi.hoisted(() => ({ buildProgram: vi.fn() }));

vi.mock("@/lib/build-server/client", () => ({ buildProgram: h.buildProgram }));
vi.mock("@superteam-lms/deploy", () => ({ setCachedBinary: vi.fn() }));

describe("Run", () => {
  it("builds the code as it is when clicked", async () => {
    h.buildProgram.mockResolvedValue({
      success: false,
      stderr: "",
      uuid: null,
    });
    let current = "pub fn rendered() {}";
    const onResult = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ChallengeRunner
          getCode={() => current}
          tests={[]}
          language="rust"
          buildType="buildable"
          onResult={onResult}
          onSubmit={() => {}}
          isComplete={false}
          xpReward={50}
        />
      </NextIntlClientProvider>
    );

    // Typed after the last render, with nothing re-rendered since.
    current = "pub fn typed_just_now() {}";
    fireEvent.click(screen.getByRole("button"));
    current = "pub fn typed_after_the_click() {}";

    await waitFor(() => expect(onResult).toHaveBeenCalled());
    const sent = JSON.stringify(h.buildProgram.mock.calls[0]?.[0]);
    expect(sent).toContain("typed_just_now");
    expect(sent).not.toContain("typed_after_the_click");
  });
});
