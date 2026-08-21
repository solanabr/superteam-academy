// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type {
  CohortLeague,
  CohortLeaderboardEntry,
} from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { CohortStrip } from "../cohort-strip";

function entry(rank: number, isYou = false): CohortLeaderboardEntry {
  return {
    userId: `u${rank}`,
    username: `learner${rank}`,
    avatarUrl: null,
    score: 1000 - rank,
    rank,
    isYou,
  };
}

/** A "you ±3" window where the viewer sits last — the owner's rank-14 case. */
function league(overrides: Partial<CohortLeague> = {}): CohortLeague {
  return {
    tier: 2,
    memberCount: 30,
    entries: [entry(11), entry(12), entry(13), entry(14, true)],
    ...overrides,
  } as CohortLeague;
}

function renderStrip(l: CohortLeague | null) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CohortStrip league={l} />
    </NextIntlClientProvider>
  );
}

/**
 * jsdom implements neither scrollTo nor layout, so the strip's geometry is
 * stubbed per test. The original descriptors are captured and put back in
 * afterEach — `delete`ing them would drop jsdom's OWN definitions, leaving
 * scrollHeight undefined and the arithmetic NaN for every later test.
 */
const PATCHED = ["scrollTo", "scrollHeight", "clientHeight"] as const;
let originals: Record<string, PropertyDescriptor | undefined> = {};

function patch(prop: string, descriptor: PropertyDescriptor) {
  Object.defineProperty(Element.prototype, prop, {
    configurable: true,
    ...descriptor,
  });
}

/** A window (180px) shorter than its content (264px) — the `.me` row is below the fold. */
function stubScrollableList(scrollTo: ReturnType<typeof vi.fn>) {
  patch("scrollTo", { writable: true, value: scrollTo });
  patch("scrollHeight", {
    get(this: Element) {
      return this.classList.contains("lb-list-mini") ? 264 : 0;
    },
  });
  patch("clientHeight", {
    get(this: Element) {
      return this.classList.contains("lb-list-mini") ? 180 : 0;
    },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  originals = {};
  for (const prop of PATCHED) {
    originals[prop] = Object.getOwnPropertyDescriptor(Element.prototype, prop);
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const prop of PATCHED) {
    const original = originals[prop];
    if (original) Object.defineProperty(Element.prototype, prop, original);
    else delete (Element.prototype as unknown as Record<string, unknown>)[prop];
  }
});

describe("CohortStrip — the viewer's own row", () => {
  it("marks it in-box, with no outline that a scroll container could clip", () => {
    const { container } = renderStrip(league());

    const me = container.querySelector(".lb-row.me");
    expect(me).not.toBeNull();
    // The marker is `.me` on the row itself; the mini stylesheet turns that
    // into an ink border plus an INSET ring rather than an outline, so it
    // draws inside the border box and `.lb-list-mini`'s overflow can never
    // shear it off.
    expect(me!.className).toContain("lb-row");
    expect(container.querySelector(".lb-list-mini")).not.toBeNull();
    expect(me!.closest(".lb-list-mini")).not.toBeNull();
  });

  it("scrolls it into the strip's window on mount", () => {
    const scrollTo = vi.fn();
    stubScrollableList(scrollTo);

    renderStrip(league());

    expect(scrollTo).toHaveBeenCalledTimes(1);
    const arg = scrollTo.mock.calls[0]![0] as ScrollToOptions;
    expect(typeof arg.top).toBe("number");
    expect(arg.top).toBeGreaterThanOrEqual(0);
    // Clamped to the scrollable range — never past the end of the list.
    expect(arg.top).toBeLessThanOrEqual(264 - 180);
  });

  it("honours reduced motion", () => {
    const scrollTo = vi.fn();
    stubScrollableList(scrollTo);
    // This jsdom has no matchMedia at all (which is why prefersReducedMotion
    // has to treat a missing one as "no preference"), so define it.
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }) as unknown as MediaQueryList)
    );

    renderStrip(league());

    expect(scrollTo.mock.calls[0]![0].behavior).toBe("auto");
  });

  it("does not scroll when the whole window already fits", () => {
    const scrollTo = vi.fn();
    patch("scrollTo", { writable: true, value: scrollTo });
    // Layout left at jsdom's default: scrollHeight === clientHeight === 0, so
    // the list is not scrollable and the effect must bail out.

    renderStrip(league());

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("does nothing when the viewer is not in the window", () => {
    const scrollTo = vi.fn();
    stubScrollableList(scrollTo);

    renderStrip(league({ entries: [entry(11), entry(12), entry(13)] }));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("CohortStrip — render guards", () => {
  it("renders nothing without a cohort", () => {
    const { container } = renderStrip(null);
    expect(container.firstChild).toBeNull();
  });

  it("renders the quiet solo state without a row list", () => {
    const { container } = renderStrip(league({ entries: [entry(1, true)] }));
    expect(container.querySelector(".lb-list-mini")).toBeNull();
  });
});
