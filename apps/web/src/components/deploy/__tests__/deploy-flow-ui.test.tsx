// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { toFriendlyError } from "@/lib/deploy/friendly-error";
import { DeployErrorNotice } from "../deploy-error-notice";
import { DeployProgressView } from "../deploy-progress";
import { DeploySuccessCard } from "../deploy-success-card";

const PROGRAM_ID = "GDDMwNyyx8uB6zrqwBFHjLLG3TBYk2F8Az4yrQC5RzMp";

function wrap(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("DeployErrorNotice", () => {
  it("shows the mapped sentence, never the raw failure", () => {
    const raw =
      'Airdrop failed after 3 attempts: 403 : {"jsonrpc":"2.0","error":{}}';
    wrap(
      <DeployErrorNotice
        error={toFriendlyError(raw, {
          source: "airdrop",
          retryAfterSeconds: 30,
        })}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The devnet faucet is busy. Try again in about 30s"
    );
    expect(screen.queryByText(/jsonrpc/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Show details/)).not.toBeInTheDocument();
  });

  it("offers no button while the app is retrying on its own", () => {
    const onAction = vi.fn();
    wrap(
      <DeployErrorNotice
        error={toFriendlyError("WalletApiError: Rate limited")}
        onAction={onAction}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The wallet service is busy"
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps an unmapped message behind the details disclosure", () => {
    wrap(
      <DeployErrorNotice
        error={toFriendlyError(
          new Error("TypeError: undefined is not a function")
        )}
        onAction={vi.fn()}
      />
    );
    const raw = screen.getByText(/TypeError: undefined is not a function/);
    expect(raw.closest("details")).not.toBeNull();
    expect(raw).not.toBeVisible();
    expect(screen.getByText("Show details")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" })
    ).toBeInTheDocument();
  });

  it("runs the one action the mapping chose", () => {
    const onAction = vi.fn();
    wrap(
      <DeployErrorNotice
        error={toFriendlyError("Build not found (404)")}
        onAction={onAction}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Back to the editor" }));
    expect(onAction).toHaveBeenCalled();
  });
});

describe("DeployProgressView", () => {
  it("leads with the phase and the bar, and folds the log away", () => {
    wrap(
      <DeployProgressView
        phase="upload"
        chunkCurrent={10}
        chunkTotal={74}
        elapsedMs={20_000}
        entries={[
          { signature: "5xAbCdEfGhIjK", message: "Chunk 3/74 uploaded" },
        ]}
      />
    );
    expect(screen.getByText("Uploading your program")).toBeInTheDocument();
    expect(screen.getByText("10 of 74 chunks")).toBeInTheDocument();
    expect(screen.getByText("20s elapsed")).toBeInTheDocument();
    expect(screen.getByText("~128s left")).toBeInTheDocument();

    const entry = screen.getByText("Chunk 3/74 uploaded");
    expect(entry.closest("details")).not.toBeNull();
    expect(entry).not.toBeVisible();
    expect(screen.getByRole("link", { name: "5xAbCdEf" })).toHaveAttribute(
      "href",
      expect.stringContaining("cluster=devnet")
    );
  });

  it("labels the ownership and refund phases when they are reached", () => {
    const { rerender } = wrap(
      <DeployProgressView
        phase="transfer"
        chunkCurrent={74}
        chunkTotal={74}
        elapsedMs={60_000}
        entries={[]}
      />
    );
    expect(screen.getByText("Transferring ownership")).toBeInTheDocument();
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DeployProgressView
          phase="refund"
          chunkCurrent={74}
          chunkTotal={74}
          elapsedMs={60_000}
          entries={[]}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Refunding leftover rent")).toBeInTheDocument();
  });
});

describe("DeploySuccessCard", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("shows the program, its cost and the submit that finishes the lesson", () => {
    const onSubmit = vi.fn();
    wrap(
      <DeploySuccessCard
        programId={PROGRAM_ID}
        rentLamports={1_500_000}
        durationMs={95_000}
        xpReward={50}
        isComplete={false}
        onSubmit={onSubmit}
        saveStatus="saved"
      />
    );

    expect(screen.getByText(PROGRAM_ID)).toBeInTheDocument();
    expect(screen.getByText("0.0015 SOL")).toBeInTheDocument();
    expect(screen.getByText("1m 35s")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explorer/ })).toHaveAttribute(
      "href",
      `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`
    );

    fireEvent.click(screen.getByRole("button", { name: /Submit lesson/ }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("copies the program id", () => {
    wrap(
      <DeploySuccessCard
        programId={PROGRAM_ID}
        rentLamports={0}
        durationMs={0}
        xpReward={50}
        isComplete={false}
        onSubmit={vi.fn()}
        saveStatus="saved"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy program ID" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(PROGRAM_ID);
  });

  it("swaps submit for the editor toolbar's completed state once complete", () => {
    wrap(
      <DeploySuccessCard
        programId={PROGRAM_ID}
        rentLamports={1_500_000}
        durationMs={95_000}
        xpReward={50}
        isComplete
        onSubmit={vi.fn()}
        saveStatus="saved"
      />
    );
    expect(screen.getByText("Lesson Complete!")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Submit lesson/ })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/XP earned/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Next lesson/ })
    ).not.toBeInTheDocument();
  });

  it("disables submit with the recording label while the save is in flight", () => {
    wrap(
      <DeploySuccessCard
        programId={PROGRAM_ID}
        rentLamports={1_500_000}
        durationMs={95_000}
        xpReward={50}
        isComplete={false}
        onSubmit={vi.fn()}
        saveStatus="saving"
      />
    );
    const submit = screen.getByRole("button", {
      name: /Recording your deploy/,
    });
    expect(submit).toBeDisabled();
  });

  it("hides submit when the save failed, leaving the retry action to the save-status slot", () => {
    wrap(
      <DeploySuccessCard
        programId={PROGRAM_ID}
        rentLamports={1_500_000}
        durationMs={95_000}
        xpReward={50}
        isComplete={false}
        onSubmit={vi.fn()}
        saveStatus="rejected"
        saveStatusSlot={<button type="button">Retry save</button>}
      />
    );
    expect(
      screen.queryByRole("button", { name: /Submit lesson/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Recording your deploy/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry save" })
    ).toBeInTheDocument();
  });
});
