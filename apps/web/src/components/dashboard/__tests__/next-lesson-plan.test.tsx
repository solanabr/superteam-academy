// @vitest-environment jsdom
// Session-end if-then plan (LX-A6, #582): "when's your next lesson?" — an
// implementation-intention prompt stored in profiles.prefs and shown back on
// return. Committing fires next_lesson_plan_committed (whose return effect is a
// pre-registered NULL), merges into any other prefs keys, and — since #869 —
// records the disclosed, default-ON reminder consent through set_reminder_opt_in.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { NextLessonPlan } from "../next-lesson-plan";

const h = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  profileRow: { prefs: {} as Record<string, unknown> },
  /** #869 consent row; null = no row at all. */
  subRow: null as {
    reminder_opt_in: boolean;
    reminder_consent_at: string | null;
    reminder_unsubscribed_at: string | null;
  } | null,
  updatePayloads: [] as Array<Record<string, unknown>>,
  rpc: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: h.trackEvent }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: table === "email_subscriptions" ? h.subRow : h.profileRow,
              error: null,
            }),
        }),
      }),
      update: (payload: Record<string, unknown>) => {
        h.updatePayloads.push(payload);
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }),
    rpc: (...args: unknown[]) => {
      h.rpc(...args);
      return Promise.resolve({ data: null, error: null });
    },
  }),
}));

beforeEach(() => {
  h.trackEvent.mockClear();
  h.profileRow = { prefs: {} };
  h.subRow = null;
  h.updatePayloads = [];
  h.rpc.mockClear();
});

function renderPlan(userId: string | null = "user-1") {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NextLessonPlan userId={userId} />
    </NextIntlClientProvider>
  );
}

describe("NextLessonPlan (LX-A6)", () => {
  it("renders nothing for an unauthenticated dashboard", () => {
    const { container } = renderPlan(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the if-then prompt + picker when no plan is stored yet", async () => {
    renderPlan();
    expect(
      await screen.findByText(messages.dashboard.nextLessonPrompt)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.dashboard.nextLessonSave })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(messages.dashboard.nextLessonDayLabel)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(messages.dashboard.nextLessonTimeLabel)
    ).toBeInTheDocument();
  });

  it("shows the committed plan (calendar tile) on a return visit", async () => {
    // Legacy single-day shape: the transition read (#980 gate F1) must still
    // display it until the prod migration converts stored rows.
    h.profileRow = { prefs: { nextLesson: { day: "tue", time: "19:00" } } };
    renderPlan();
    // Tile anatomy: 3-letter day strip + stored time; no sentence copy.
    expect(await screen.findByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("19:00")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.dashboard.nextLessonEdit })
    ).toBeInTheDocument();
    // Picker is not shown until the learner chooses to change the plan.
    expect(
      screen.queryByRole("button", { name: messages.dashboard.nextLessonSave })
    ).not.toBeInTheDocument();
  });

  it("commits the plan: writes prefs (merging other keys) and fires the event", async () => {
    h.profileRow = { prefs: { theme: "dark" } };
    renderPlan();
    await screen.findByText(messages.dashboard.nextLessonPrompt);

    // Chips: deselect the default Tuesday, select Wednesday.
    fireEvent.click(screen.getByRole("button", { name: "Tue", pressed: true }));
    fireEvent.click(
      screen.getByRole("button", { name: "Wed", pressed: false })
    );
    fireEvent.change(
      screen.getByLabelText(messages.dashboard.nextLessonTimeLabel),
      { target: { value: "08:30" } }
    );
    fireEvent.click(
      screen.getByRole("button", { name: messages.dashboard.nextLessonSave })
    );

    await waitFor(() => expect(h.updatePayloads).toHaveLength(1));
    // Merge: the pre-existing prefs key survives alongside the new plan.
    expect(h.updatePayloads[0]).toEqual({
      prefs: {
        theme: "dark",
        nextLesson: { days: ["wed"], time: "08:30" },
      },
    });
    // Only the closed-set weekday id travels in the event — never the exact time.
    expect(h.trackEvent).toHaveBeenCalledWith("next_lesson_plan_committed", {
      day: "wed",
    });
  });

  // Owner, 22-08: a selected day wears the shared `.pressed-key` treatment —
  // ink ring and hard lift from the ink family, fill and label from the primary
  // Button's tokens. Unselected stays the quiet pill.
  it("gives a selected day the pressed-key treatment and leaves the rest quiet", async () => {
    renderPlan();
    await screen.findByText(messages.dashboard.nextLessonPrompt);

    const tue = screen.getByRole("button", { name: "Tue", pressed: true });
    const wed = screen.getByRole("button", { name: "Wed", pressed: false });

    // The shared pressed-key treatment: ink ring + hard lift from the ink
    // family, fill and label from the primary Button's tokens (owner, 22-08 —
    // superseding the earlier chip-green spec).
    expect(tue.className).toContain("pressed-key");
    expect(tue.className).toContain("daykey");

    expect(wed.className).not.toContain("pressed-key");
    expect(wed.getAttribute("data-cat")).toBeNull();
    // Unselected pills joined the shared quiet hairline every bordered element
    // on a card uses (owner, 22-08) — they no longer carry their own border
    // token.
    expect(wed.className).toContain("[border-color:var(--quiet-line)]");

    // The two states must be visually distinguishable, not just aria-different.
    expect(tue.className).not.toBe(wed.className);
  });

  it("moves the treatment with the selection", async () => {
    renderPlan();
    await screen.findByText(messages.dashboard.nextLessonPrompt);

    fireEvent.click(
      screen.getByRole("button", { name: "Wed", pressed: false })
    );

    // Multi-select: both days now wear it (days[] has always been a set).
    for (const name of ["Tue", "Wed"]) {
      const btn = screen.getByRole("button", { name, pressed: true });
      expect(btn.className).toContain("pressed-key daykey");
    }

    fireEvent.click(screen.getByRole("button", { name: "Tue", pressed: true }));
    expect(
      screen.getByRole("button", { name: "Tue", pressed: false }).className
    ).not.toContain("pressed-key");
  });
});

// #869 — the plan card is the consent-capture surface for the session-plan
// reminder email. Default ON is the "derived from the commitment" default, but
// it is only ever WRITTEN by this explicit save.
describe("NextLessonPlan — reminder consent (#869)", () => {
  const remindLabel = messages.dashboard.nextLessonRemindMe;

  async function openPicker() {
    renderPlan();
    await screen.findByText(messages.dashboard.nextLessonPrompt);
  }

  it("offers the disclosed reminder checkbox, checked by default", async () => {
    await openPicker();
    const box = screen.getByLabelText(remindLabel) as HTMLInputElement;
    expect(box.checked).toBe(true);
  });

  it("records consent on save, with the learner's locale", async () => {
    await openPicker();
    fireEvent.click(
      screen.getByRole("button", { name: messages.dashboard.nextLessonSave })
    );
    await waitFor(() => expect(h.rpc).toHaveBeenCalled());
    expect(h.rpc).toHaveBeenCalledWith("set_reminder_opt_in", {
      p_opt_in: true,
      p_locale: "en",
    });
  });

  it("records an explicit opt-OUT when the learner unchecks it", async () => {
    await openPicker();
    fireEvent.click(screen.getByLabelText(remindLabel));
    fireEvent.click(
      screen.getByRole("button", { name: messages.dashboard.nextLessonSave })
    );
    await waitFor(() => expect(h.rpc).toHaveBeenCalled());
    expect(h.rpc).toHaveBeenCalledWith("set_reminder_opt_in", {
      p_opt_in: false,
      p_locale: "en",
    });
  });

  it("respects a previously recorded opt-out instead of re-defaulting to ON", async () => {
    h.subRow = {
      reminder_opt_in: false,
      reminder_consent_at: null,
      reminder_unsubscribed_at: "2026-07-30T00:00:00Z",
    };
    await openPicker();
    const box = screen.getByLabelText(remindLabel) as HTMLInputElement;
    expect(box.checked).toBe(false);
  });

  // A #779 marketing subscriber already HAS a row carrying
  // reminder_opt_in=false with no reminder timestamps. Reading row existence as
  // "decided" silently denied those learners the default-ON offer.
  it("treats a MARKETING-ONLY row as undecided and still offers the default ON", async () => {
    h.subRow = {
      reminder_opt_in: false,
      reminder_consent_at: null,
      reminder_unsubscribed_at: null,
    };
    await openPicker();
    const box = screen.getByLabelText(remindLabel) as HTMLInputElement;
    expect(box.checked).toBe(true);
  });

  it("respects a recorded opt-IN (consent timestamp present)", async () => {
    h.subRow = {
      reminder_opt_in: true,
      reminder_consent_at: "2026-07-30T00:00:00Z",
      reminder_unsubscribed_at: null,
    };
    await openPicker();
    const box = screen.getByLabelText(remindLabel) as HTMLInputElement;
    expect(box.checked).toBe(true);
  });
});
