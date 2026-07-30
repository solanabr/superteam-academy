// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Lesson, ParsonsBlockData } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { ParsonsBlock } from "../parsons-block";
import type { BlockContext } from "../types";

const parsonsBlock: ParsonsBlockData = {
  _type: "parsons",
  key: "p-block",
  prompt: "Arrange the function.",
  lines: [
    { id: "sig", content: "function add(a, b) {" },
    { id: "ret", content: "  return a + b;" },
    { id: "close", content: "}" },
    { id: "bad", content: "  return a - b;", distractor: true },
  ],
  correctOrder: ["sig", "ret", "close"],
  explanation: "Signature first, then the body, then the closing brace.",
};

const lesson: Lesson = {
  _id: "lesson-1",
  title: "Lesson",
  slug: "lesson",
  blocks: [parsonsBlock],
};

function makeCtx(overrides: Partial<BlockContext> = {}): BlockContext {
  return {
    lesson,
    courseSlug: "course",
    courseId: "course-1",
    locale: "en",
    isEnrolled: true,
    isCompleted: false,
    xpReward: 30,
    earnedXp: null,
    onEnroll: vi.fn(),
    setProof: vi.fn(),
    setQuizAnswered: vi.fn(),
    aiSuppressed: true,
    capstoneAiOff: false,
    buildUuid: null,
    programKeypairSecret: null,
    resetBuild: vi.fn(),
    ...overrides,
  };
}

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

/** Arrange the full correct solution by clicking Add on each line in order. */
function buildCorrect() {
  fireEvent.click(
    screen.getByRole("button", { name: /Add line: function add/ })
  );
  fireEvent.click(
    screen.getByRole("button", { name: /Add line: return a \+ b/ })
  );
  fireEvent.click(screen.getByRole("button", { name: /Add line: \}/ }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ParsonsBlock — arrange interaction", () => {
  it("starts every line in the bank and the solution empty", () => {
    renderWithIntl(<ParsonsBlock block={parsonsBlock} ctx={makeCtx()} />);
    expect(
      screen.getByText("Add lines from the pool to build your answer.")
    ).toBeInTheDocument();
    // Add button per line (including the distractor) = 4.
    expect(screen.getAllByRole("button", { name: /Add line:/ })).toHaveLength(
      4
    );
  });

  it("Check is disabled until at least one line is placed", () => {
    renderWithIntl(<ParsonsBlock block={parsonsBlock} ctx={makeCtx()} />);
    expect(screen.getByRole("button", { name: "Check order" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: /Add line: function add/ })
    );
    expect(screen.getByRole("button", { name: "Check order" })).toBeEnabled();
  });

  it("reports the arranged order upward as the block proof", () => {
    const ctx = makeCtx();
    renderWithIntl(<ParsonsBlock block={parsonsBlock} ctx={ctx} />);
    buildCorrect();
    expect(ctx.setProof).toHaveBeenLastCalledWith("p-block", {
      order: ["sig", "ret", "close"],
    });
  });

  it("the correct order → Correct + explanation", () => {
    renderWithIntl(<ParsonsBlock block={parsonsBlock} ctx={makeCtx()} />);
    buildCorrect();
    fireEvent.click(screen.getByRole("button", { name: "Check order" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Signature first, then the body, then the closing brace."
      )
    ).toBeInTheDocument();
  });

  it("a wrong order → incorrect verdict (server stays authoritative)", () => {
    renderWithIntl(<ParsonsBlock block={parsonsBlock} ctx={makeCtx()} />);
    // Place close before ret → out of order.
    fireEvent.click(
      screen.getByRole("button", { name: /Add line: function add/ })
    );
    fireEvent.click(screen.getByRole("button", { name: /Add line: \}/ }));
    fireEvent.click(
      screen.getByRole("button", { name: /Add line: return a \+ b/ })
    );
    fireEvent.click(screen.getByRole("button", { name: "Check order" }));
    expect(
      screen.getByText("Not quite — some lines are out of order.")
    ).toBeInTheDocument();
  });

  it("Move up reorders the solution and the proof follows", () => {
    const ctx = makeCtx();
    renderWithIntl(<ParsonsBlock block={parsonsBlock} ctx={ctx} />);
    // Place ret then sig (wrong), then move sig up to fix it.
    fireEvent.click(
      screen.getByRole("button", { name: /Add line: return a \+ b/ })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Add line: function add/ })
    );
    expect(ctx.setProof).toHaveBeenLastCalledWith("p-block", {
      order: ["ret", "sig"],
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Move line up: function add/ })
    );
    expect(ctx.setProof).toHaveBeenLastCalledWith("p-block", {
      order: ["sig", "ret"],
    });
  });

  it("Remove returns a line to the bank", () => {
    const ctx = makeCtx();
    renderWithIntl(<ParsonsBlock block={parsonsBlock} ctx={ctx} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Add line: function add/ })
    );
    expect(ctx.setProof).toHaveBeenLastCalledWith("p-block", {
      order: ["sig"],
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Remove line: function add/ })
    );
    expect(ctx.setProof).toHaveBeenLastCalledWith("p-block", { order: [] });
  });

  it("editing after a check retires the verdict", () => {
    renderWithIntl(<ParsonsBlock block={parsonsBlock} ctx={makeCtx()} />);
    buildCorrect();
    fireEvent.click(screen.getByRole("button", { name: "Check order" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Remove line: \}/ }));
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();
  });

  it("Move up is disabled for the first solution line and Move down for the last", () => {
    renderWithIntl(<ParsonsBlock block={parsonsBlock} ctx={makeCtx()} />);
    buildCorrect();
    expect(
      screen.getByRole("button", { name: /Move line up: function add/ })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Move line down: \}/ })
    ).toBeDisabled();
  });

  it("no paired distractor → no look-alike marker and no pairing hint", () => {
    // The default block's distractor carries no `pairedWith`, so nothing pairs.
    renderWithIntl(<ParsonsBlock block={parsonsBlock} ctx={makeCtx()} />);
    expect(screen.queryByText(/Look-alike/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Some lines are look-alikes/)
    ).not.toBeInTheDocument();
  });

  it("renders the verdict inside an aria-live region", () => {
    const { container } = renderWithIntl(
      <ParsonsBlock block={parsonsBlock} ctx={makeCtx()} />
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
    buildCorrect();
    fireEvent.click(screen.getByRole("button", { name: "Check order" }));
    expect(
      within(live as HTMLElement).getByText("Correct!")
    ).toBeInTheDocument();
  });
});

/** A block whose distractor `bad` is paired with the real line `ret` (F13). */
const pairedBlock: ParsonsBlockData = {
  _type: "parsons",
  key: "p-paired",
  prompt: "Arrange the function.",
  lines: [
    { id: "sig", content: "function add(a, b) {" },
    { id: "ret", content: "  return a + b;" },
    { id: "close", content: "}" },
    {
      id: "bad",
      content: "  return a - b;",
      distractor: true,
      pairedWith: "ret",
    },
  ],
  correctOrder: ["sig", "ret", "close"],
  explanation: "Signature first, then the body, then the closing brace.",
};

describe("ParsonsBlock — paired distractors (F13)", () => {
  it("marks BOTH the distractor and its pairedWith target with one shared tag", () => {
    renderWithIntl(<ParsonsBlock block={pairedBlock} ctx={makeCtx()} />);
    // `bad` and its target `ret` share group 1 → two identical markers, and the
    // marker never says which of the pair is the trap.
    expect(screen.getAllByText("Look-alike 1")).toHaveLength(2);
    expect(screen.getByText(/Some lines are look-alikes/)).toBeInTheDocument();
  });

  it("the marker is not colour-only — it carries the group text for AT", () => {
    renderWithIntl(<ParsonsBlock block={pairedBlock} ctx={makeCtx()} />);
    // The visible, machine-readable text is the accessible signal (colour is
    // decorative), so a colour-blind or AT user still perceives the pairing.
    expect(screen.getAllByText("Look-alike 1")[0]).toBeVisible();
  });

  it("the pairing marker follows a line as it moves into the solution", () => {
    renderWithIntl(<ParsonsBlock block={pairedBlock} ctx={makeCtx()} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Add line: return a \+ b/ })
    );
    // `ret` now sits in the solution and `bad` still in the bank — both keep the
    // shared marker, so the count is unchanged.
    expect(screen.getAllByText("Look-alike 1")).toHaveLength(2);
  });

  it("including a look-alike distractor grades wrong client-side", () => {
    renderWithIntl(<ParsonsBlock block={pairedBlock} ctx={makeCtx()} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Add line: function add/ })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Add line: return a - b/ })
    );
    fireEvent.click(screen.getByRole("button", { name: /Add line: \}/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check order" }));
    expect(
      screen.getByText("Not quite — some lines are out of order.")
    ).toBeInTheDocument();
  });

  it("two look-alikes for ONE real line all share a single group (no orphan)", () => {
    // Two traps for `ret` is legitimate authoring; grouping by target keeps the
    // target + both distractors in one group of three, never orphaning the first
    // distractor into its own marker.
    const twoTraps: ParsonsBlockData = {
      _type: "parsons",
      key: "p-two-traps",
      prompt: "Arrange the function.",
      lines: [
        { id: "sig", content: "function add(a, b) {" },
        { id: "ret", content: "  return a + b;" },
        { id: "close", content: "}" },
        {
          id: "bad1",
          content: "  return a - b;",
          distractor: true,
          pairedWith: "ret",
        },
        {
          id: "bad2",
          content: "  return b - a;",
          distractor: true,
          pairedWith: "ret",
        },
      ],
      correctOrder: ["sig", "ret", "close"],
    };
    renderWithIntl(<ParsonsBlock block={twoTraps} ctx={makeCtx()} />);
    // ret + bad1 + bad2 = three members, one shared marker, and only one group
    // exists (no stray "Look-alike 2").
    expect(screen.getAllByText("Look-alike 1")).toHaveLength(3);
    expect(screen.queryByText("Look-alike 2")).not.toBeInTheDocument();
  });
});
