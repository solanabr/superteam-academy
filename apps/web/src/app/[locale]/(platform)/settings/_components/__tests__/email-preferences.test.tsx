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
    h.subRow = { opt_in: true, reminder_opt_in: false };
    renderPanel();
    await waitFor(() =>
      expect(switchFor(MARKETING)).toHaveAttribute("aria-checked", "true")
    );
    expect(switchFor(REMINDERS)).toHaveAttribute("aria-checked", "false");
  });

  it("a REMINDER opt-in never turns the marketing switch on", async () => {
    h.subRow = { opt_in: false, reminder_opt_in: true };
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
    h.subRow = { opt_in: false, reminder_opt_in: false };
    renderPanel();
    await waitFor(() => expect(switchFor(REMINDERS)).toBeEnabled());
    expect(switchFor(REMINDERS)).toHaveAttribute("aria-checked", "false");
    expect(
      screen.queryByText(messages.settings.reminderEmailsDerived)
    ).not.toBeInTheDocument();
  });
});
