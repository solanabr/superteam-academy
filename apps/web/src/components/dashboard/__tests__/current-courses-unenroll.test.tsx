// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { Keypair } from "@solana/web3.js";
import type { CurrentCourse } from "@/lib/dashboard/types";
import messages from "@/messages/en.json";

const wallet = vi.hoisted(() => ({
  publicKey: null as unknown,
  setVisible: vi.fn(),
  sendTransaction: vi.fn(),
  confirmTransaction: vi.fn(),
  sendRawTransaction: vi.fn(),
}));

const dynamic = vi.hoisted(() => ({
  account: null as { address: string } | null,
  signWithDynamicWallet: vi.fn(),
}));

const auth = vi.hoisted(() => ({ walletAddress: null as string | null }));

vi.mock("@solana/wallet-adapter-react", () => ({
  useConnection: () => ({
    connection: {
      confirmTransaction: wallet.confirmTransaction,
      sendRawTransaction: wallet.sendRawTransaction,
    },
  }),
  useWallet: () => ({
    publicKey: wallet.publicKey,
    sendTransaction: wallet.sendTransaction,
  }),
}));
vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: wallet.setVisible }),
}));
vi.mock("@/lib/dynamic/solana", () => ({
  getDynamicSolanaAccount: () => dynamic.account,
  signWithDynamicWallet: dynamic.signWithDynamicWallet,
}));
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ profile: { wallet_address: auth.walletAddress } }),
}));
vi.mock("@/lib/solana/instructions", () => ({
  buildCloseEnrollmentInstruction: vi.fn(() => ({
    keys: [],
    programId: Keypair.generate().publicKey,
    data: Buffer.alloc(0),
  })),
}));
vi.mock("@/lib/solana/program-errors", () => ({
  preflightTransaction: vi.fn(() => Promise.resolve()),
  parseProgramError: vi.fn(() => ({ i18nKey: null, fallback: "failed" })),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/components/ui/toast-container", () => ({ dispatchToast: vi.fn() }));
vi.mock("@/components/certificates/course-completion-mint", () => ({
  CourseCompletionMint: () => null,
}));

import { CurrentCoursesSection } from "../current-courses-section";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const course: CurrentCourse = {
  courseId: "course-solana-101",
  title: "Solana 101",
  slug: "solana-101",
  completedLessons: 0,
  totalLessons: 8,
  difficulty: "beginner",
  learningPath: null,
  thumbnail: null,
};

function renderSection(overrides: Partial<CurrentCourse> = {}) {
  return renderWithIntl(
    <CurrentCoursesSection
      currentCourses={[{ ...course, ...overrides }]}
      userId="user-1"
    />
  );
}

const clickUnenroll = async () =>
  userEvent.click(
    screen.getByRole("button", { name: messages.dashboard.removeCourse })
  );

beforeEach(() => {
  vi.clearAllMocks();
  wallet.publicKey = null;
  dynamic.account = null;
  auth.walletAddress = null;
});

describe("CurrentCoursesSection — unenroll wallet resolution", () => {
  it("signs with the Dynamic embedded wallet when no adapter wallet is connected", async () => {
    const address = Keypair.generate().publicKey.toBase58();
    dynamic.account = { address };
    auth.walletAddress = address;
    dynamic.signWithDynamicWallet.mockResolvedValue({
      serialize: () => new Uint8Array(),
    });
    wallet.sendRawTransaction.mockResolvedValue("dynamic-signature");
    wallet.confirmTransaction.mockResolvedValue({ value: { err: null } });

    renderSection();
    await clickUnenroll();

    await waitFor(() =>
      expect(dynamic.signWithDynamicWallet).toHaveBeenCalledTimes(1)
    );
    expect(wallet.sendRawTransaction).toHaveBeenCalledTimes(1);
    // No adapter modal for an embedded-wallet learner — that was the dead end.
    expect(wallet.setVisible).not.toHaveBeenCalled();
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
  });

  it("explains before connecting when neither wallet exists", async () => {
    renderSection();
    await clickUnenroll();

    expect(
      screen.getByText(messages.walletPrompt.connectBodyUnknown)
    ).toBeInTheDocument();
    // The raw adapter modal only opens after the learner asks for it.
    expect(wallet.setVisible).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: messages.walletPrompt.connectAction })
    );
    expect(wallet.setVisible).toHaveBeenCalledWith(true);
  });

  it("refuses to build a transaction when the connected wallet is not the linked one", async () => {
    wallet.publicKey = Keypair.generate().publicKey;
    auth.walletAddress = Keypair.generate().publicKey.toBase58();

    renderSection();
    await clickUnenroll();

    expect(
      screen.getByText(messages.walletPrompt.mismatchTitle)
    ).toBeInTheDocument();
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
    expect(wallet.setVisible).not.toHaveBeenCalled();
  });
});

describe("CurrentCoursesSection — unenroll preconditions", () => {
  it("blocks the ✕ once a lesson is completed (close_enrollment would reject)", async () => {
    wallet.publicKey = Keypair.generate().publicKey;

    renderSection({ completedLessons: 2 });

    const button = screen.getByRole("button", {
      name: messages.dashboard.unenrollStarted,
    });
    expect(button).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(button);
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
  });
});
