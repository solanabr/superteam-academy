// @vitest-environment jsdom
// "Explain this error" in the pane: the request the editor's button makes, and
// the pane that shows nothing but its answer while a quiz is unanswered.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";
import type { AssistTier, PartnerResponse } from "@/lib/ai/partner-types";
import type { PartnerMessage } from "@/lib/ai/use-ai-partner";
import { AiPartnerPane } from "../ai-partner-pane";

const hookState = {
  messages: [] as PartnerMessage[],
  counts: { free: 0, metered: 0, socratic: 0 },
  tier: "free" as AssistTier,
  budgetExhausted: false,
  spendCapped: false,
  resetState: "none" as const,
  resetAvailableAt: null as number | null,
  loading: false,
  error: null as string | null,
  errorKind: null as "generic" | "billed" | "noChange" | null,
  proposeFix: vi.fn(),
  ask: vi.fn(),
  explainError: vi.fn(async () => {}),
  explanation: null as PartnerResponse | null,
  review: vi.fn(async () => true),
  requestReset: vi.fn(async () => ({
    allowed: false,
    reason: "error",
    availableAt: null,
  })),
  verifyCheck: vi.fn(),
};

const hookOptions = vi.fn();
vi.mock("@/lib/ai/use-ai-partner", () => ({
  useAiPartner: (options: unknown) => {
    hookOptions(options);
    return hookState;
  },
}));

type PaneProps = Partial<React.ComponentProps<typeof AiPartnerPane>>;

const CATALOGS = { en, es, "pt-BR": ptBR } as const;

function pane(props: PaneProps, locale: keyof typeof CATALOGS = "en") {
  return (
    <NextIntlClientProvider locale={locale} messages={CATALOGS[locale]}>
      <AiPartnerPane
        lessonSlug="l"
        courseSlug="c"
        getCode={() => "code"}
        getTestSummary={() => "0/1 passing"}
        onApply={() => {}}
        hasRunTests
        hasFailedRun
        {...props}
      />
    </NextIntlClientProvider>
  );
}

const EARLIER: PartnerMessage[] = [
  { role: "user", text: "an earlier question" },
  { role: "ai", response: { type: "answer", text: "an earlier answer" } },
];
const EXPLANATION: PartnerResponse = {
  type: "answer",
  text: "The name missing_value is not defined.",
};

beforeEach(() => {
  hookOptions.mockClear();
  hookState.explainError.mockClear();
  hookState.ask.mockClear();
  hookState.messages = [];
  hookState.explanation = null;
  hookState.tier = "free";
  hookState.budgetExhausted = false;
  hookState.loading = false;
  hookState.error = null;
  hookState.errorKind = null;
});

describe("AiPartnerPane: a request to explain the build error", () => {
  it("asks the fixed question once for each request", () => {
    const view = render(pane({ explainRequest: 0 }));
    expect(hookState.explainError).not.toHaveBeenCalled();

    view.rerender(pane({ explainRequest: 1 }));
    expect(hookState.explainError).toHaveBeenCalledTimes(1);
    expect(hookState.explainError).toHaveBeenCalledWith(
      en.aiPartner.explainError.message
    );

    // The same request is not asked again on a later render.
    view.rerender(pane({ explainRequest: 1, solutionPassed: false }));
    expect(hookState.explainError).toHaveBeenCalledTimes(1);

    view.rerender(pane({ explainRequest: 2 }));
    expect(hookState.explainError).toHaveBeenCalledTimes(2);
    // Never as a free-text ask.
    expect(hookState.ask).not.toHaveBeenCalled();
  });

  it("asks at once when it mounts with a request", () => {
    render(pane({ explainRequest: 1, answerOnly: true }));

    expect(hookState.explainError).toHaveBeenCalledTimes(1);
  });

  it.each(["es", "pt-BR"] as const)("asks the question in %s", (locale) => {
    render(pane({ explainRequest: 1 }, locale));

    expect(hookState.explainError).toHaveBeenCalledWith(
      CATALOGS[locale].aiPartner.explainError.message
    );
  });

  it.each([
    ["the lesson is complete", { disabled: true }, {}],
    ["the turns are used up", {}, { budgetExhausted: true }],
    ["another request is in flight", {}, { loading: true }],
  ] as const)("does not ask when %s", (_name, props, state) => {
    Object.assign(hookState, state);
    const view = render(pane({ explainRequest: 0, ...props }));

    view.rerender(pane({ explainRequest: 1, ...props }));

    expect(hookState.explainError).not.toHaveBeenCalled();
  });

  it("opens a collapsed pane for the answer", () => {
    const view = render(pane({ explainRequest: 0 }));
    const header = screen.getByRole("button", { expanded: true });
    header.click();
    view.rerender(pane({ explainRequest: 0 }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    view.rerender(pane({ explainRequest: 1 }));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("passes the build output source on to the hook", () => {
    const getBuildOutput = () => "Line 4: x";
    render(pane({ getBuildOutput }));

    expect(hookOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ getBuildOutput })
    );
  });

  it("reports when no action can start", () => {
    const onAvailabilityChange = vi.fn();
    const view = render(pane({ onAvailabilityChange }));
    expect(onAvailabilityChange).toHaveBeenLastCalledWith(true);

    hookState.loading = true;
    view.rerender(pane({ onAvailabilityChange }));
    expect(onAvailabilityChange).toHaveBeenLastCalledWith(false);

    hookState.loading = false;
    hookState.budgetExhausted = true;
    view.rerender(pane({ onAvailabilityChange }));
    expect(onAvailabilityChange).toHaveBeenLastCalledWith(false);

    // A pane that is gone holds nothing back.
    view.unmount();
    expect(onAvailabilityChange).toHaveBeenLastCalledWith(true);
  });
});

describe("AiPartnerPane: answer only", () => {
  it("shows the explanation and nothing to type in or ask with", () => {
    hookState.messages = [
      ...EARLIER,
      { role: "user", text: en.aiPartner.explainError.message },
      { role: "ai", response: EXPLANATION },
    ];
    hookState.explanation = EXPLANATION;
    render(pane({ answerOnly: true, explainRequest: 1, solutionPassed: true }));

    expect(screen.getByText(EXPLANATION.text)).toBeInTheDocument();
    expect(
      screen.getByText(en.aiPartner.explainError.answerOnly)
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: en.aiPartner.actions.askSend })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: new RegExp(en.aiPartner.actions.propose),
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: en.aiPartner.actions.review })
    ).not.toBeInTheDocument();
    // The earlier chat stays closed with the rest of the tutor.
    expect(screen.queryByText("an earlier answer")).not.toBeInTheDocument();
    expect(screen.queryByText("an earlier question")).not.toBeInTheDocument();
    expect(screen.queryByText(en.aiPartner.subtitle)).not.toBeInTheDocument();
  });

  it("shows no message list before there is an explanation", () => {
    hookState.messages = EARLIER;
    render(pane({ answerOnly: true, explainRequest: 1 }));

    expect(screen.queryByText("an earlier answer")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("still says why there is no answer", () => {
    hookState.budgetExhausted = true;
    render(pane({ answerOnly: true, explainRequest: 1 }));

    expect(screen.getByText(en.aiPartner.exhausted.title)).toBeInTheDocument();
  });

  it("becomes the whole tutor again when the quiz is answered", () => {
    hookState.messages = [...EARLIER, { role: "ai", response: EXPLANATION }];
    hookState.explanation = EXPLANATION;
    const view = render(pane({ answerOnly: true, explainRequest: 1 }));

    view.rerender(pane({ answerOnly: false, explainRequest: 1 }));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByText("an earlier answer")).toBeInTheDocument();
    expect(screen.getByText(EXPLANATION.text)).toBeInTheDocument();
    expect(
      screen.queryByText(en.aiPartner.explainError.answerOnly)
    ).not.toBeInTheDocument();
    // The move out of answer-only is not a new request.
    expect(hookState.explainError).toHaveBeenCalledTimes(1);
  });
});
