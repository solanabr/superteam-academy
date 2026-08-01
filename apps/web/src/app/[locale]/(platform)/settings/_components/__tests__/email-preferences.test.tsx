// @vitest-environment jsdom
// #869 — the settings panel carries TWO independent email consents. What is
// pinned here: the reminder switch never inherits the marketing state, each
// toggle writes its OWN RPC, and the derived default (ON when a plan day is
// committed, #582) is a DISPLAY suggestion that is only persisted by an
// explicit toggle — the send pipeline gates on the stored value alone.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { EmailPreferences } from "../email-preferences";

const h = vi.hoisted(() => ({
  subRow: null as {
    opt_in: boolean;
    reminder_opt_in: boolean;
    reminder_consent_at: string | null;
    reminder_unsubscribed_at: string | null;
  } | null,
  profileRow: { prefs: {} as Record<string, unknown> },
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }),
    },
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
    }),
    rpc: (...args: unknown[]) => {
      h.rpc(...args);
      return Promise.resolve({ data: null, error: null });
    },
  }),
}));

const MARKETING = messages.settings.marketingEmails;
const REMINDERS = messages.settings.reminderEmails;
const CONFIRM = messages.settings.reminderEmailsConfirm;

/** A row where the learner HAS decided about reminders (timestamps present). */
const decided = (row: { opt_in: boolean; reminder_opt_in: boolean }) => ({
  ...row,
  reminder_consent_at: row.reminder_opt_in ? "2026-07-30T00:00:00Z" : null,
  reminder_unsubscribed_at: row.reminder_opt_in ? null : "2026-07-30T00:00:00Z",
});

/**
 * A #779 MARKETING-ONLY row: it exists, but no reminder decision was ever made
 * (both reminder timestamps NULL) — row existence is not a decision.
 */
const marketingOnly = (optIn: boolean) => ({
  opt_in: optIn,
  reminder_opt_in: false,
  reminder_consent_at: null,
  reminder_unsubscribed_at: null,
});

const renderPanel = () =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmailPreferences />
    </NextIntlClientProvider>
  );

const switchFor = (label: string) =>
  screen.getByRole("switch", { name: label });

beforeEach(() => {
  h.subRow = null;
  h.profileRow = { prefs: {} };
  h.rpc.mockClear();
});

describe("EmailPreferences — independent consents", () => {
  it("shows both switches OFF for a learner with no row and no plan", async () => {
    renderPanel();
    await waitFor(() =>
      expect(switchFor(MARKETING)).toHaveAttribute("aria-checked", "false")
    );
    expect(switchFor(REMINDERS)).toHaveAttribute("aria-checked", "false");
  });

  it("a MARKETING opt-in never turns the reminder switch on", async () => {
    h.subRow = decided({ opt_in: true, reminder_opt_in: false });
    renderPanel();
    await waitFor(() =>
      expect(switchFor(MARKETING)).toHaveAttribute("aria-checked", "true")
    );
    expect(switchFor(REMINDERS)).toHaveAttribute("aria-checked", "false");
  });

  it("a REMINDER opt-in never turns the marketing switch on", async () => {
    h.subRow = decided({ opt_in: false, reminder_opt_in: true });
    renderPanel();
    await waitFor(() =>
      expect(switchFor(REMINDERS)).toHaveAttribute("aria-checked", "true")
    );
    expect(switchFor(MARKETING)).toHaveAttribute("aria-checked", "false");
  });

  it("each switch writes its OWN consent RPC", async () => {
    renderPanel();
    await waitFor(() => expect(switchFor(MARKETING)).toBeEnabled());

    fireEvent.click(switchFor(MARKETING));
    await waitFor(() =>
      expect(h.rpc).toHaveBeenCalledWith("set_marketing_opt_in", {
        p_opt_in: true,
      })
    );

    fireEvent.click(switchFor(REMINDERS));
    await waitFor(() =>
      expect(h.rpc).toHaveBeenCalledWith("set_reminder_opt_in", {
        p_opt_in: true,
        p_locale: "en",
      })
    );
  });
});

describe("EmailPreferences — derived reminder default (#582)", () => {
  it("suggests ON, with disclosure, when a plan day is committed", async () => {
    h.profileRow = { prefs: { nextLesson: { day: "tue", time: "19:00" } } };
    renderPanel();
    await waitFor(() =>
      expect(switchFor(REMINDERS)).toHaveAttribute("aria-checked", "true")
    );
    // The disclosure states that nothing is sent on the suggestion alone.
    expect(
      screen.getByText(messages.settings.reminderEmailsDerived)
    ).toBeInTheDocument();
    // …and no consent was written just by rendering the panel.
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("a RECORDED opt-out wins over the derived default", async () => {
    h.profileRow = { prefs: { nextLesson: { day: "tue", time: "19:00" } } };
    h.subRow = decided({ opt_in: false, reminder_opt_in: false });
    renderPanel();
    await waitFor(() => expect(switchFor(REMINDERS)).toBeEnabled());
    expect(switchFor(REMINDERS)).toHaveAttribute("aria-checked", "false");
    expect(
      screen.queryByText(messages.settings.reminderEmailsDerived)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(CONFIRM)).not.toBeInTheDocument();
  });

  // A #779 marketing subscriber ALREADY has a row. Reading row
  // existence as "decided" pinned those learners to a hard OFF and denied them
  // the derived default entirely.
  it("a MARKETING-ONLY row is not a reminder decision: derived default applies", async () => {
    h.profileRow = { prefs: { nextLesson: { day: "tue", time: "19:00" } } };
    h.subRow = marketingOnly(true);
    renderPanel();
    await waitFor(() =>
      expect(switchFor(REMINDERS)).toHaveAttribute("aria-checked", "true")
    );
    expect(
      screen.getByText(messages.settings.reminderEmailsDerived)
    ).toBeInTheDocument();
    // Marketing state is read straight from the row, untouched.
    expect(switchFor(MARKETING)).toHaveAttribute("aria-checked", "true");
  });

  it("a marketing-only row with NO plan still shows the reminder switch OFF", async () => {
    h.subRow = marketingOnly(true);
    renderPanel();
    await waitFor(() => expect(switchFor(REMINDERS)).toBeEnabled());
    expect(switchFor(REMINDERS)).toHaveAttribute("aria-checked", "false");
  });
});

// While the switch shows a DERIVED ON, toggling it is the OFF
// action, so without a confirm affordance a learner who wants the ON they are
// looking at has no way to store it, and the disclosure invites an action that
// does the opposite.
describe("EmailPreferences — confirming a derived ON (#869 F1)", () => {
  beforeEach(() => {
    h.profileRow = { prefs: { nextLesson: { day: "tue", time: "19:00" } } };
  });

  it("CONFIRM persists the displayed ON (not its opposite)", async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText(CONFIRM)).toBeEnabled());
    fireEvent.click(screen.getByText(CONFIRM));
    await waitFor(() =>
      expect(h.rpc).toHaveBeenCalledWith("set_reminder_opt_in", {
        p_opt_in: true,
        p_locale: "en",
      })
    );
    // …and the switch stays ON.
    expect(switchFor(REMINDERS)).toHaveAttribute("aria-checked", "true");
  });

  it("the confirm affordance disappears once the decision is recorded", async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText(CONFIRM)).toBeEnabled());
    fireEvent.click(screen.getByText(CONFIRM));
    await waitFor(() =>
      expect(screen.queryByText(CONFIRM)).not.toBeInTheDocument()
    );
    expect(
      screen.queryByText(messages.settings.reminderEmailsDerived)
    ).not.toBeInTheDocument();
  });

  it("toggling a derived ON still records the explicit opt-OUT", async () => {
    renderPanel();
    await waitFor(() => expect(switchFor(REMINDERS)).toBeEnabled());
    fireEvent.click(switchFor(REMINDERS));
    await waitFor(() =>
      expect(h.rpc).toHaveBeenCalledWith("set_reminder_opt_in", {
        p_opt_in: false,
        p_locale: "en",
      })
    );
  });

  it("shows NO confirm button when the derived default is OFF (no plan)", async () => {
    h.profileRow = { prefs: {} };
    renderPanel();
    await waitFor(() => expect(switchFor(REMINDERS)).toBeEnabled());
    expect(screen.queryByText(CONFIRM)).not.toBeInTheDocument();
  });
});
