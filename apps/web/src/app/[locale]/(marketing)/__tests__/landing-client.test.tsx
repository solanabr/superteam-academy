// @vitest-environment jsdom
import type { ReactElement, ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { LandingPageClient } from "../landing-client";

// Heavy children / browser-bound modules are stubbed — the CTA wiring is the
// unit under test, not the showcase animations or the auth flow.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { alt, src } = props as { alt?: string; src?: string };
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt ?? ""} src={typeof src === "string" ? src : ""} />;
  },
}));
vi.mock("@/components/layout/footer", () => ({ Footer: () => <footer /> }));
vi.mock("@/components/auth/auth-error-toast", () => ({
  AuthErrorToast: () => null,
}));
vi.mock("@/components/landing/hero-showcase", () => ({
  HeroShowcase: () => <div data-testid="hero-showcase" />,
}));
vi.mock("@/components/landing/loop-widgets", () => ({
  BuildWidget: () => <div />,
  EarnWidget: () => <div />,
  ProveWidget: () => <div />,
}));
vi.mock("@/components/landing/paths-explorer", () => ({
  PathsExplorer: () => <div />,
}));
// AuthModal renders its trigger inside a marker so a test can prove a given CTA
// is (or is not) an auth-modal trigger.
vi.mock("@/components/auth/auth-modal", () => ({
  AuthModal: ({ trigger }: { trigger?: ReactNode }) => (
    <span data-testid="auth-modal">{trigger}</span>
  ),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  }),
}));

beforeEach(() => {
  // jsdom lacks these; the landing page touches them at mount.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  // LiveSlot fetches the RPC on mount; never resolve — it's decorative.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );
});

const FLAGSHIP_HREF = "/en/courses/course-solana-fundamentals/lessons/intro";
const PAYMENTS_HREF = "/en/courses/stablecoin-agentic-payments/lessons/why";

function renderLanding(href = FLAGSHIP_HREF): ReturnType<typeof render> {
  const ui: ReactElement = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <LandingPageClient
        courseCount={5}
        totalXpMinted={0}
        enrolledBuilders={0}
        credentialsIssued={0}
        learningPaths={[]}
        achievements={[]}
        flagshipLessonHref={href}
        paymentsCourseHref={PAYMENTS_HREF}
      />
    </NextIntlClientProvider>
  );
  return render(ui);
}

describe("LandingPageClient — LX-A1 deep-link CTAs", () => {
  it("hero primary CTA is a deep-link to flagship lesson 1, not an auth trigger", () => {
    renderLanding();
    const hero = screen.getByRole("link", { name: /start building/i });
    expect(hero).toHaveAttribute("href", FLAGSHIP_HREF);
    // It is a real anchor, not a button that opens the modal.
    expect(hero.tagName).toBe("A");
    expect(hero.closest("[data-testid='auth-modal']")).toBeNull();
  });

  it("bottom Get Started deep-links instead of opening the auth modal", () => {
    renderLanding();
    const getStarted = screen.getByRole("link", { name: /get started/i });
    expect(getStarted).toHaveAttribute("href", FLAGSHIP_HREF);
    // No auth modal wraps it, and there is no Get Started *button* anymore.
    expect(getStarted.closest("[data-testid='auth-modal']")).toBeNull();
    expect(screen.queryByRole("button", { name: /get started/i })).toBeNull();
  });

  it("the only auth modal left on the page is the deliberate Sign Up affordance", () => {
    renderLanding();
    const modals = screen.getAllByTestId("auth-modal");
    expect(modals).toHaveLength(1);
    expect(within(modals[0]!).getByText(/sign up/i)).toBeInTheDocument();
  });

  it("keeps the payments wedge alongside the AI wedge, CTA deep-linked", () => {
    renderLanding();
    // The AI wedge is still the hero line (#874: add, never replace).
    expect(
      screen.getAllByText(/AI writes the code/i).length
    ).toBeGreaterThanOrEqual(1);
    // The payments wedge and its dated, attributed source.
    expect(screen.getByText(messages.landing.payTitle)).toBeInTheDocument();
    expect(screen.getByText(messages.landing.payStatValue)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: new RegExp(messages.landing.payCta) })
    ).toHaveAttribute("href", PAYMENTS_HREF);
  });

  it("renders the deep-link href verbatim under a non-default locale prefix", () => {
    const ptHref = "/pt-BR/courses/course-solana-fundamentals/lessons/intro";
    renderLanding(ptHref);
    expect(
      screen.getByRole("link", { name: /start building/i })
    ).toHaveAttribute("href", ptHref);
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      ptHref
    );
  });
});
