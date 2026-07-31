// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import CertificateViewPage from "../page";

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
  tables: [] as string[],
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      db.tables.push(table);
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: table === "certificates" ? db.certRow : db.profileRow,
            }),
          }),
        }),
      };
    },
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
  db.tables = [];
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

// LX-F1 (#873): the mint_success surface is covered by the share-nudge and
// earn-card component tests; this closes the second surface — the certificate
// page — so both `source` values of each click event are pinned by a test.
describe("certificate verify page — share + Earn instrumentation (LX-F1)", () => {
  it("fires credential_share_click once per share click, tagged certificate_page", async () => {
    renderPage();

    fireEvent.click(
      await screen.findByText(messages.certificates.addToLinkedIn)
    );
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenLastCalledWith("credential_share_click", {
      channel: "linkedin_add",
      source: "certificate_page",
      courseId: "solana-101",
    });

    fireEvent.click(screen.getByText(messages.certificates.share));
    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenLastCalledWith("credential_share_click", {
      channel: "x",
      source: "certificate_page",
      courseId: "solana-101",
    });
  });

  it("fires earn_handoff_click once, tagged certificate_page", async () => {
    renderPage();

    fireEvent.click(await screen.findByText(messages.earnHandoff.development));
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("earn_handoff_click", {
      category: "development",
      source: "certificate_page",
      courseId: "solana-101",
    });
  });
});

describe("certificate verify page — localized recipient fallback", () => {
  it("renders the username when the profile has one", async () => {
    renderPage();
    expect(await screen.findByText("gabi")).toBeInTheDocument();
  });

  // #493: the recipient's identity must come from the public_profiles view,
  // never the raw profiles table (which exposes google_id/github_id).
  it("reads the recipient from public_profiles, never the raw profiles table", async () => {
    renderPage();
    expect(await screen.findByText("gabi")).toBeInTheDocument();
    expect(db.tables).toContain("public_profiles");
    expect(db.tables).not.toContain("profiles");
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
