// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { HackathonPromo } from "../hackathon-promo";

/**
 * The promo bar shows on the landing page and the courses catalog, nowhere
 * else. Mounted once in the app shell, so the gate is what decides visibility.
 */
const state = vi.hoisted(() => ({ pathname: "/en" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));

function renderAt(pathname: string): void {
  state.pathname = pathname;
  const ui: ReactElement = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <HackathonPromo />
    </NextIntlClientProvider>
  );
  render(ui);
}

const bar = () => screen.queryByRole("img", { name: "Crypto World's Fair" });

beforeEach(() => {
  state.pathname = "/en";
});
afterEach(cleanup);

describe("HackathonPromo — route gate", () => {
  it("shows on the landing page", () => {
    renderAt("/en");
    expect(bar()).not.toBeNull();
  });

  it("shows on the courses catalog", () => {
    renderAt("/en/courses");
    expect(bar()).not.toBeNull();
  });

  it("ignores a trailing slash", () => {
    renderAt("/en/courses/");
    expect(bar()).not.toBeNull();
  });

  it("is hidden on a specific course page", () => {
    renderAt("/en/courses/solana-hackathon-expert");
    expect(bar()).toBeNull();
  });

  it("is hidden elsewhere (dashboard, community, …)", () => {
    renderAt("/en/dashboard");
    expect(bar()).toBeNull();
    cleanup();
    renderAt("/en/community");
    expect(bar()).toBeNull();
  });
});
