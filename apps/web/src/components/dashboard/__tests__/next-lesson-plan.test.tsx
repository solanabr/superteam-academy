// @vitest-environment jsdom
// Session-end if-then plan (LX-A6, #582): "when's your next lesson?" — an
// implementation-intention prompt stored in profiles.prefs and shown back on
// return. v1 is display-only; committing fires next_lesson_plan_committed (whose
// return effect is a pre-registered NULL) and merges into any other prefs keys.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { NextLessonPlan } from "../next-lesson-plan";

const h = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  profileRow: { prefs: {} as Record<string, unknown> },
  updatePayloads: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: h.trackEvent }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: h.profileRow, error: null }),
        }),
      }),
      update: (payload: Record<string, unknown>) => {
        h.updatePayloads.push(payload);
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }),
  }),
}));

beforeEach(() => {
  h.trackEvent.mockClear();
  h.profileRow = { prefs: {} };
  h.updatePayloads = [];
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

  it("shows the committed if-then plan on a return visit", async () => {
    h.profileRow = { prefs: { nextLesson: { day: "tue", time: "19:00" } } };
    renderPlan();
    // The committed sentence interpolates the localized weekday + stored time.
    expect(await screen.findByText(/Tuesday.*19:00/)).toBeInTheDocument();
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

    fireEvent.change(
      screen.getByLabelText(messages.dashboard.nextLessonDayLabel),
      {
        target: { value: "wed" },
      }
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
        nextLesson: { day: "wed", time: "08:30" },
      },
    });
    // Only the closed-set weekday id travels in the event — never the exact time.
    expect(h.trackEvent).toHaveBeenCalledWith("next_lesson_plan_committed", {
      day: "wed",
    });
  });
});
