// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import CertificateViewPage from "../page";
import messages from "@/messages/en.json";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "cert-1" }),
}));

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent }));

const MINT_ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
const METADATA_URI = "https://gateway.irys.xyz/test-metadata";

const db = vi.hoisted(() => ({
  certRow: null as Record<string, unknown> | null,
  profileRow: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: table === "certificates" ? db.certRow : db.profileRow,
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/content/client-queries", () => ({
  getCoursesByIds: async () => [
    {
      _id: "solana-101",
      learningPath: "Solana Development",
      difficulty: "beginner",
    },
  ],
}));

function stubMetadataFetch(attributes: unknown[] | null): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      attributes === null
        ? ({ ok: false, json: async () => ({}) } as Response)
        : ({
            ok: true,
            json: async () => ({ name: "Solana 101", attributes }),
          } as Response)
    )
  );
}

function setCert(overrides: Record<string, unknown> = {}): void {
  db.certRow = {
    id: "cert-1",
    user_id: "user-1",
    course_id: "solana-101",
    course_title: "Solana Fundamentals",
    mint_address: MINT_ADDRESS,
    metadata_uri: METADATA_URI,
    minted_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
  db.profileRow = { username: "gabi", wallet_address: "wallet-1" };
}

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CertificateViewPage />
    </NextIntlClientProvider>
  );
}

/** The NFT-details explorer button (not ProofPill, whose href omits the
 *  cluster param on mainnet-beta). */
function explorerLinks(): string[] {
  return screen
    .getAllByRole("link")
    .map((link) => link.getAttribute("href") ?? "")
    .filter((href) => href.startsWith("https://explorer.solana.com/address/"));
}

const ORIGINAL_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK;

beforeEach(() => {
  trackEvent.mockClear();
  delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  setCert();
  stubMetadataFetch([{ trait_type: "Course Version", value: 3 }]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (ORIGINAL_NETWORK === undefined) {
    delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  } else {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = ORIGINAL_NETWORK;
  }
});

describe("certificate verify page — credential anatomy (F35)", () => {
  it("shows issuer, unique credential ID, and course version, clearly labeled", async () => {
    renderPage();

    expect(await screen.findByText("Issuer")).toBeInTheDocument();
    expect(screen.getByText("Superteam Academy")).toBeInTheDocument();

    expect(screen.getByText("Credential ID")).toBeInTheDocument();
    // Unique ID = truncated mint address (also shown on the card itself)
    expect(screen.getAllByText(/7xKXtg\.\.\./).length).toBeGreaterThan(0);

    expect(screen.getByText("Course Version")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("omits the course-version row for pre-#497 credentials (absent-safe)", async () => {
    stubMetadataFetch([{ trait_type: "Course", value: "Solana 101" }]);
    renderPage();

    expect(await screen.findByText("Issuer")).toBeInTheDocument();
    expect(screen.queryByText("Course Version")).not.toBeInTheDocument();
  });

  it("omits the course-version row when the metadata is unreachable", async () => {
    stubMetadataFetch(null);
    renderPage();

    expect(await screen.findByText("Issuer")).toBeInTheDocument();
    expect(screen.queryByText("Course Version")).not.toBeInTheDocument();
  });
});

describe("certificate verify page — network label from env", () => {
  it("defaults to Devnet when NEXT_PUBLIC_SOLANA_NETWORK is unset", async () => {
    renderPage();

    expect(await screen.findByText("Devnet")).toBeInTheDocument();
    expect(
      explorerLinks().some((href) => href.endsWith("?cluster=devnet"))
    ).toBe(true);
  });

  it("labels Mainnet and targets the mainnet-beta explorer cluster", async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "mainnet";
    renderPage();

    expect(await screen.findByText("Mainnet")).toBeInTheDocument();
    expect(screen.queryByText("Devnet")).not.toBeInTheDocument();
    expect(
      explorerLinks().some((href) => href.endsWith("?cluster=mainnet-beta"))
    ).toBe(true);
    // Never the invalid bare "mainnet" cluster param
    expect(
      explorerLinks().some((href) => href.endsWith("?cluster=mainnet"))
    ).toBe(false);
  });
});

describe("certificate verify page — localized recipient fallback", () => {
  it("renders the username when the profile has one", async () => {
    renderPage();
    expect(await screen.findByText("gabi")).toBeInTheDocument();
  });

  it("falls back to the message catalog when the username is missing", async () => {
    db.profileRow = { username: null, wallet_address: "wallet-1" };
    renderPage();

    expect(
      await screen.findByText(messages.certificates.recipientFallback)
    ).toBeInTheDocument();
  });

  it("uses the active locale's catalog for the fallback (not hardcoded English)", async () => {
    db.profileRow = { username: null, wallet_address: "wallet-1" };
    const localized = {
      ...messages,
      certificates: {
        ...messages.certificates,
        recipientFallback: "Construtora",
      },
    };
    render(
      <NextIntlClientProvider locale="en" messages={localized}>
        <CertificateViewPage />
      </NextIntlClientProvider>
    );

    expect(await screen.findByText("Construtora")).toBeInTheDocument();
  });
});
