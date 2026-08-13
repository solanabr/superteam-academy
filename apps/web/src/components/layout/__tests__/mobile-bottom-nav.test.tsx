// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileBottomNav } from "../mobile-bottom-nav";

const state = vi.hoisted(() => ({
  pathname: "/en/dashboard",
  user: null as { id: string } | null,
  profile: null as { id: string } | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: state.user, profile: state.profile }),
}));

function signIn() {
  state.user = { id: "user-1" };
  state.profile = { id: "user-1" };
}

beforeEach(() => {
  state.pathname = "/en/dashboard";
  state.user = null;
  state.profile = null;
});

describe("MobileBottomNav", () => {
  it("shows the four platform tabs for a signed-in user on a platform page", () => {
    signIn();
    render(<MobileBottomNav />);
    for (const key of ["dashboard", "courses", "review", "community"]) {
      expect(screen.getByText(key)).toBeInTheDocument();
    }
  });

  it("keeps the landing page clean for signed-out visitors", () => {
    state.pathname = "/en";
    const { container } = render(<MobileBottomNav />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the nav on the landing page for a signed-in learner", () => {
    // The mobile browse-after-login fix: a learner landing on `/` must be able
    // to reach Courses/Dashboard without hunting through the header.
    signIn();
    state.pathname = "/en";
    render(<MobileBottomNav />);
    expect(screen.getByText("courses")).toBeInTheDocument();
    expect(screen.getByText("dashboard")).toBeInTheDocument();
  });

  it("renders the footer spacer on the landing page only", () => {
    signIn();
    state.pathname = "/en";
    const landing = render(<MobileBottomNav />);
    expect(
      landing.container.querySelector("[aria-hidden]")
    ).toBeInTheDocument();
    landing.unmount();

    state.pathname = "/en/courses";
    const platform = render(<MobileBottomNav />);
    // Platform pages reserve their own space (pb-20) — a spacer there would
    // double the gap.
    expect(platform.container.querySelector("[aria-hidden]")).toBeNull();
  });

  it("stays hidden on lesson pages, which carry their own toolbar", () => {
    signIn();
    state.pathname = "/en/courses/solana-101/lessons/intro";
    const { container } = render(<MobileBottomNav />);
    expect(container).toBeEmptyDOMElement();
  });

  it("marks the active tab with aria-current", () => {
    signIn();
    state.pathname = "/en/courses";
    render(<MobileBottomNav />);
    expect(screen.getByText("courses").closest("a")).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByText("dashboard").closest("a")).not.toHaveAttribute(
      "aria-current"
    );
  });
});
