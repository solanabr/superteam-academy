// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { DiffCard } from "../diff-card";
import messages from "@/messages/en.json";

const check = {
  question: "Why?",
  options: ["A", "B", "C"] as [string, string, string],
};

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

it("gates Accept behind a correct answer and only applies on the Accept click", async () => {
  const onAccept = vi.fn();
  const onVerify = vi
    .fn()
    .mockResolvedValueOnce({ correct: false, explanation: "because B" })
    .mockResolvedValueOnce({ correct: true, explanation: "because B" });

  renderWithIntl(
    <DiffCard
      current="a"
      proposed="a\nb"
      rationale="adds b"
      check={check}
      checkToken="tok"
      onVerify={onVerify}
      onAccept={onAccept}
      onReject={() => {}}
      stale={false}
    />
  );

  // The check is shown immediately; Accept starts locked.
  expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();

  // Wrong pick: verified, not applied, explanation shown, Accept stays locked.
  fireEvent.click(screen.getByRole("button", { name: "A" }));
  await waitFor(() => expect(onVerify).toHaveBeenCalledWith("tok", 0));
  expect(onAccept).not.toHaveBeenCalled();
  await screen.findByText(/because B/);
  expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();

  // Correct pick: unlocks Accept but does NOT apply the code yet.
  fireEvent.click(screen.getByRole("button", { name: "B" }));
  await waitFor(() => expect(onVerify).toHaveBeenCalledWith("tok", 1));
  expect(onAccept).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /accept/i })).not.toBeDisabled()
  );

  // Only the explicit Accept click applies the proposed code.
  // NOTE: `proposed="a\nb"` is a JSX string-literal attribute, whose runtime
  // value is the 4-char string a\nb (backslash + n), not a real newline — so
  // the assertion matches a literal backslash-n.
  fireEvent.click(screen.getByRole("button", { name: /accept/i }));
  expect(onAccept).toHaveBeenCalledWith("a\\nb");

  // After applying, the card confirms and retires the action buttons.
  expect(screen.getByText(/applied to your code/i)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /accept/i })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /dismiss/i })
  ).not.toBeInTheDocument();
});

it("Accept is disabled when stale", () => {
  renderWithIntl(
    <DiffCard
      current="a"
      proposed="b"
      rationale=""
      check={check}
      checkToken="tok"
      onVerify={vi.fn()}
      onAccept={() => {}}
      onReject={() => {}}
      stale={true}
    />
  );
  expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();
});

describe("DiffCard additional behavior", () => {
  it("shows the comprehension check immediately", () => {
    renderWithIntl(
      <DiffCard
        current="a"
        proposed="a\nb"
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={vi.fn()}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
      />
    );
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
    expect(screen.getByText(check.question)).toBeInTheDocument();
  });

  it("calls onReject when Dismiss is clicked", () => {
    const onReject = vi.fn();
    renderWithIntl(
      <DiffCard
        current="a"
        proposed="a\nb"
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={vi.fn()}
        onAccept={() => {}}
        onReject={onReject}
        stale={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("renders the rationale text", () => {
    renderWithIntl(
      <DiffCard
        current="a"
        proposed="a\nb"
        rationale="adds b for clarity"
        check={check}
        checkToken="tok"
        onVerify={vi.fn()}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
      />
    );
    expect(screen.getByText("adds b for clarity")).toBeInTheDocument();
  });

  it("does not unlock Accept and stays retryable when onVerify throws", async () => {
    const onAccept = vi.fn();
    const onVerify = vi.fn().mockRejectedValue(new Error("network down"));
    renderWithIntl(
      <DiffCard
        current="a"
        proposed="a\nb"
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={onVerify}
        onAccept={onAccept}
        onReject={() => {}}
        stale={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "A" }));

    await waitFor(() => expect(onVerify).toHaveBeenCalled());
    expect(onAccept).not.toHaveBeenCalled();
    // Accept stays locked; the options remain retryable (not stuck disabled).
    expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "A" })).not.toBeDisabled();
  });

  it("disables option buttons while a verify is in flight", async () => {
    let resolveVerify!: (v: { correct: boolean; explanation: string }) => void;
    const onVerify = vi.fn(
      () =>
        new Promise<{ correct: boolean; explanation: string }>((resolve) => {
          resolveVerify = resolve;
        })
    );
    renderWithIntl(
      <DiffCard
        current="a"
        proposed="a\nb"
        rationale="adds b"
        check={check}
        checkToken="tok"
        onVerify={onVerify}
        onAccept={() => {}}
        onReject={() => {}}
        stale={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "A" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "A" })).toBeDisabled()
    );

    resolveVerify({ correct: false, explanation: "nope" });
    await screen.findByText(/nope/);
  });
});
