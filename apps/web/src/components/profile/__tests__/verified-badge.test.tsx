// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { toVerifiedKind } from "@/lib/profiles/public-profile";
import { VerifiedBadge } from "../verified-badge";

/**
 * The badge says WHICH kind of author is vouched for (#1234), not just that
 * one is. Colour carries the kind — brand green for a Superteam member, the
 * theme's ink for a partner — but colour is never the whole message: the same
 * string is the tooltip and the accessible name, so a colour-blind reader, a
 * greyscale screenshot and a screen reader all get it.
 */
function renderBadge(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

afterEach(cleanup);

describe("VerifiedBadge — the kind is named, not just coloured", () => {
  it("a Superteam member reads 'Superteam member' and wears the brand green", () => {
    renderBadge(<VerifiedBadge kind="superteam" />);
    const badge = screen.getByRole("img", { name: "Superteam member" });
    expect(badge.className).toContain("text-primary");
    expect(badge.className).not.toContain("text-text");
  });

  it("a partner reads 'Verified partner' and wears the theme's ink, which flips with the theme", () => {
    renderBadge(<VerifiedBadge kind="partner" />);
    const badge = screen.getByRole("img", { name: "Verified partner" });
    // `text-text` IS the flip: --text is near-black on light, near-white on
    // dark, which is what "white or black depending on the mode" asks for.
    expect(badge.className).toContain("text-text");
    expect(badge.className).not.toContain("text-primary");
  });

  it("a verified author with no kind yet keeps the pre-#1234 badge rather than losing one", () => {
    renderBadge(<VerifiedBadge />);
    expect(
      screen.getByRole("img", { name: "Verified teacher" })
    ).toBeInTheDocument();

    cleanup();
    renderBadge(<VerifiedBadge kind={null} />);
    expect(
      screen.getByRole("img", { name: "Verified teacher" })
    ).toBeInTheDocument();
  });

  it("is reachable by keyboard, so the label is not hover-only", () => {
    renderBadge(<VerifiedBadge kind="superteam" />);
    expect(
      screen.getByRole("img", { name: "Superteam member" })
    ).toHaveAttribute("tabindex", "0");
  });
});

describe("toVerifiedKind — the closed set, mirrored from the DB CHECK", () => {
  it("accepts exactly the two kinds", () => {
    expect(toVerifiedKind("superteam")).toBe("superteam");
    expect(toVerifiedKind("partner")).toBe("partner");
  });

  it("refuses anything else, so a typo'd column value cannot reach the UI as a kind", () => {
    for (const bad of [
      "Superteam",
      "SUPERTEAM",
      "team",
      "",
      null,
      undefined,
      1,
      {},
    ]) {
      expect(toVerifiedKind(bad)).toBeNull();
    }
  });
});
