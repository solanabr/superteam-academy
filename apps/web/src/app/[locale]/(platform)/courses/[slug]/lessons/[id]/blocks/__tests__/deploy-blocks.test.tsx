// @vitest-environment jsdom
import type { ComponentType, ReactElement } from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { CodeBlockData, Lesson } from "@superteam-lms/types";
import en from "@/messages/en.json";
import ptBR from "@/messages/pt-BR.json";
import es from "@/messages/es.json";
import { WalletFundingBlock } from "../wallet-funding-block";
import { DeployedProgramCardBlock } from "../deployed-program-card-block";
import { CodeBlock } from "../code-block";
import { ProgramExplorerBlock } from "../program-explorer-block";
import type { BlockContext } from "../types";

// Every dynamic import (funding card, deploy panel, challenge editor) renders
// as a stub that exposes the props it would receive.
vi.mock("next/dynamic", () => ({
  default: (): ComponentType<Record<string, unknown>> =>
    function DynamicStub(props) {
      return (
        <div
          data-testid="dynamic-stub"
          data-deployable={String(props.isDeployable)}
        />
      );
    },
}));

const codeBlock: CodeBlockData = {
  _type: "code",
  key: "ping-program",
  language: "rust",
  buildType: "buildable",
  deployable: true,
  starter: "",
  solution: "",
  tests: [],
};

function makeCtx(): BlockContext {
  const lesson: Lesson = {
    _id: "lesson-b2s-your-first-solana-program",
    title: "Your first Solana program",
    slug: "your-first-solana-program",
    blocks: [codeBlock],
  };
  return {
    lesson,
    courseSlug: "btc-to-sol-evolution",
    courseId: "course-btc-to-sol-evolution",
    locale: "en",
    isEnrolled: true,
    isCompleted: false,
    lessonNumber: 1,
    xpReward: 20,
    earnedXp: null,
    onEnroll: vi.fn(),
    setProof: vi.fn(),
    setQuizAnswered: vi.fn(),
    setBlockDone: vi.fn(),
    aiSuppressed: false,
    capstoneAiOff: false,
    buildUuid: null,
    programKeypairSecret: null,
    resetBuild: vi.fn(),
    canSubmit: true,
  };
}

function renderWithIntl(
  ui: ReactElement,
  locale = "en",
  messages: Record<string, unknown> = en
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const fundingBlock = { _type: "wallet-funding" as const, key: "fund" };
const deployBlock = {
  _type: "deployed-program-card" as const,
  key: "deployed",
};
const explorerBlock = {
  _type: "program-explorer" as const,
  key: "explorer",
  idl: "{}",
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet");
  vi.stubEnv("NEXT_PUBLIC_SOLANA_RPC_URL", "https://api.devnet.solana.com");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("deploy blocks with the in-lesson deploy on", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED", "true");
  });

  it("mount the funding card, the deploy panel and the program explorer", () => {
    renderWithIntl(
      <>
        <WalletFundingBlock block={fundingBlock} ctx={makeCtx()} />
        <DeployedProgramCardBlock block={deployBlock} ctx={makeCtx()} />
        <ProgramExplorerBlock block={explorerBlock} ctx={makeCtx()} />
      </>
    );
    expect(screen.getAllByTestId("dynamic-stub")).toHaveLength(3);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keep a deployable code block waiting on the deploy", () => {
    renderWithIntl(<CodeBlock block={codeBlock} ctx={makeCtx()} />);
    expect(screen.getByTestId("dynamic-stub").dataset.deployable).toBe("true");
  });
});

describe.each([
  ["the flag is off", { flag: "", label: "devnet" }],
  ["the app is on mainnet", { flag: "true", label: "mainnet-beta" }],
])("deploy blocks when %s", (_name, { flag, label }) => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED", flag);
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", label);
  });

  it("show a notice instead of the funding card, the deploy panel and the program explorer", () => {
    renderWithIntl(
      <>
        <WalletFundingBlock block={fundingBlock} ctx={makeCtx()} />
        <DeployedProgramCardBlock block={deployBlock} ctx={makeCtx()} />
        <ProgramExplorerBlock block={explorerBlock} ctx={makeCtx()} />
      </>
    );
    expect(screen.queryByTestId("dynamic-stub")).toBeNull();
    const notices = screen.getAllByRole("status");
    expect(notices).toHaveLength(3);
    expect(notices[0]).toHaveTextContent("Wallet funding is paused");
    expect(notices[1]).toHaveTextContent(
      "Deploying from the lesson is coming back soon"
    );
    expect(notices[1]).toHaveTextContent("You can still finish this lesson");
    expect(notices[2]).toHaveTextContent(
      "Sending transactions from the lesson is coming back soon"
    );
  });

  it("never names a cluster, so it reads right on mainnet too", () => {
    for (const [locale, messages] of [
      ["en", en],
      ["pt-BR", ptBR],
      ["es", es],
    ] as const) {
      const { container, unmount } = renderWithIntl(
        <>
          <WalletFundingBlock block={fundingBlock} ctx={makeCtx()} />
          <DeployedProgramCardBlock block={deployBlock} ctx={makeCtx()} />
          <ProgramExplorerBlock block={explorerBlock} ctx={makeCtx()} />
        </>,
        locale,
        messages
      );
      expect(container.textContent?.toLowerCase()).not.toMatch(
        /devnet|mainnet|testnet/
      );
      unmount();
    }
  });

  it("let the code block submit without a deploy", () => {
    renderWithIntl(<CodeBlock block={codeBlock} ctx={makeCtx()} />);
    expect(screen.getByTestId("dynamic-stub").dataset.deployable).toBe("false");
  });

  it.each([
    ["pt-BR", ptBR, "O deploy pela lição volta em breve"],
    ["es", es, "El despliegue desde la lección vuelve pronto"],
  ])("is translated (%s)", (locale, messages, title) => {
    renderWithIntl(
      <DeployedProgramCardBlock block={deployBlock} ctx={makeCtx()} />,
      locale,
      messages
    );
    expect(screen.getByRole("status")).toHaveTextContent(title);
  });
});
