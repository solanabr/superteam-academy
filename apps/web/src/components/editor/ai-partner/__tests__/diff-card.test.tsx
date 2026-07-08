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

it("applies only after the correct check answer is server-verified", async () => {
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
  fireEvent.click(screen.getByRole("button", { name: /accept/i })); // reveals the check
  fireEvent.click(screen.getByRole("button", { name: "A" })); // wrong

  await waitFor(() => expect(onVerify).toHaveBeenCalledWith("tok", 0));
  expect(onAccept).not.toHaveBeenCalled();
  await screen.findByText(/because B/);

  fireEvent.click(screen.getByRole("button", { name: "B" })); // correct
  await waitFor(() => expect(onVerify).toHaveBeenCalledWith("tok", 1));
  // NOTE: `proposed="a\nb"` above is a JSX string-literal attribute, which
  // (unlike a JS string literal) does not interpret `\n` as an escape — the
  // prop's actual runtime value is the 4-char string a\nb (backslash + n).
  // onAccept must receive that exact value unmodified, so the assertion
  // matches it as a literal backslash-n, not a real newline.
  await waitFor(() => expect(onAccept).toHaveBeenCalledWith("a\\nb"));
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
  it("does not reveal the check until Accept is clicked", () => {
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
    expect(screen.queryByRole("button", { name: "A" })).not.toBeInTheDocument();
    expect(screen.queryByText(check.question)).not.toBeInTheDocument();
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

  it("does not call onAccept and shows a generic retry when onVerify rejects/throws", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /accept/i }));
    fireEvent.click(screen.getByRole("button", { name: "A" }));

    await waitFor(() => expect(onVerify).toHaveBeenCalled());
    expect(onAccept).not.toHaveBeenCalled();
    // The option buttons must still be present/retryable, not stuck disabled
    // forever on a thrown verify.
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
    fireEvent.click(screen.getByRole("button", { name: /accept/i }));
    fireEvent.click(screen.getByRole("button", { name: "A" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "A" })).toBeDisabled()
    );

    resolveVerify({ correct: false, explanation: "nope" });
    await screen.findByText(/nope/);
  });
});
