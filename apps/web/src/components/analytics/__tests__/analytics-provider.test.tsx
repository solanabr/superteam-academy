// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { AnalyticsProvider } from "../analytics-provider";

const identifyUser = vi.fn();
const resetUser = vi.fn();
const auth = vi.hoisted(() => ({ user: null as unknown }));

vi.mock("next/navigation", () => ({ usePathname: () => "/en" }));
vi.mock("@/lib/auth/auth-provider", () => ({ useAuth: () => auth }));
vi.mock("@/lib/analytics", () => ({
  initAnalytics: vi.fn(),
  trackPageView: vi.fn(),
  identifyUser: (...args: unknown[]) => identifyUser(...args),
  resetUser: (...args: unknown[]) => resetUser(...args),
}));

const learner = {
  id: "user-1",
  email: "learner@example.com",
  user_metadata: { wallet_address: "7xK" },
};

describe("AnalyticsProvider identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.user = null;
  });

  afterEach(cleanup);

  it("identifies by user id only, with no email or wallet", () => {
    auth.user = learner;
    render(<AnalyticsProvider>x</AnalyticsProvider>);

    expect(identifyUser).toHaveBeenCalledTimes(1);
    expect(identifyUser.mock.calls[0]).toEqual(["user-1"]);
  });

  it("doesn't re-identify when the auth object changes for the same user", () => {
    auth.user = learner;
    const { rerender } = render(<AnalyticsProvider>x</AnalyticsProvider>);

    auth.user = { ...learner, user_metadata: { wallet_address: "9yZ" } };
    rerender(<AnalyticsProvider>y</AnalyticsProvider>);

    expect(identifyUser).toHaveBeenCalledTimes(1);
  });

  it("resets when a signed-in user goes away, as with sign-out in another tab", () => {
    auth.user = learner;
    const { rerender } = render(<AnalyticsProvider>x</AnalyticsProvider>);

    auth.user = null;
    rerender(<AnalyticsProvider>y</AnalyticsProvider>);

    expect(resetUser).toHaveBeenCalledTimes(1);
  });

  it("doesn't reset an anonymous visitor", () => {
    const { rerender } = render(<AnalyticsProvider>x</AnalyticsProvider>);
    rerender(<AnalyticsProvider>y</AnalyticsProvider>);

    expect(resetUser).not.toHaveBeenCalled();
  });
});
