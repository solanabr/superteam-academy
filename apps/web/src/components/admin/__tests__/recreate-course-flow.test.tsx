// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { RecreateCourseFlow } from "../recreate-course-flow";
import type { DiffEntry } from "@/lib/admin/sync-diff";
import messages from "@/messages/en.json";

const COURSE_ID = "course-solana-101";

const IMMUTABLE_DIFFS: DiffEntry[] = [
  {
    field: "creator",
    contentValue: "CREATOR111",
    onChainValue: "AUTH1111",
    updateable: false,
  },
];

function preflightDto(unusualCreator: boolean) {
  return {
    canRecreate: true as const,
    courseId: COURSE_ID,
    coursePda: "PDA111",
    creatorOnChain: "AUTH1111",
    creatorResolved: "CREATOR111",
    liveLessonCount: 3,
    unusualCreator,
    immutableDiffs: [
      {
        field: "creator",
        onChainValue: "AUTH1111",
        contentValue: "CREATOR111",
      },
    ],
    lostCounters: { totalCompletions: 42, totalEnrollments: 100 },
  };
}

const EXECUTE_RESULT = {
  action: "recreated",
  coursePda: "PDA111",
  closeSignature: "close-sig",
  createSignature: "create-sig",
  createAttempts: 1,
  lostCounters: { totalCompletions: 42, totalEnrollments: 100 },
  warnings: [],
};

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

/** Mock fetch: GET → preflight DTO, POST → execute result. */
function mockFetch(unusualCreator: boolean) {
  const fetchMock = vi.fn(
    (_url: string, init?: { method?: string; body?: string }) => {
      const body =
        !init || !init.method || init.method === "GET"
          ? preflightDto(unusualCreator)
          : EXECUTE_RESULT;
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    }
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** GET → preflight DTO (normal creator); POST → the supplied responder. */
function mockFetchCustomPost(post: () => Promise<Response>) {
  const fetchMock = vi.fn(
    (_url: string, init?: { method?: string; body?: string }) => {
      if (!init || !init.method || init.method === "GET") {
        return Promise.resolve(
          new Response(JSON.stringify(preflightDto(false)), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        );
      }
      return post();
    }
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** Render, open the modal, type the id, and click Confirm with a POST responder. */
async function executeWith(post: () => Promise<Response>) {
  const onRecreated = vi.fn();
  const fetchMock = mockFetchCustomPost(post);
  renderWithIntl(
    <RecreateCourseFlow
      courseId={COURSE_ID}
      courseTitle="Solana 101"
      immutableDiffs={IMMUTABLE_DIFFS}
      onRecreated={onRecreated}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: /Recreate course…/ }));
  await screen.findByRole("dialog");
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: COURSE_ID },
  });
  fireEvent.click(screen.getByRole("button", { name: "Recreate course" }));
  return { fetchMock, onRecreated };
}

async function openModal(unusualCreator: boolean) {
  const onRecreated = vi.fn();
  const fetchMock = mockFetch(unusualCreator);
  renderWithIntl(
    <RecreateCourseFlow
      courseId={COURSE_ID}
      courseTitle="Solana 101"
      immutableDiffs={IMMUTABLE_DIFFS}
      onRecreated={onRecreated}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: /Recreate course…/ }));
  await screen.findByRole("dialog");
  return { fetchMock, onRecreated };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  // @ts-expect-error — reset the global fetch stub between tests.
  delete global.fetch;
});

describe("RecreateCourseFlow — confirm gating (b)", () => {
  it("keeps Confirm disabled until the exact courseId is typed", async () => {
    await openModal(false);

    const confirm = () =>
      screen.getByRole("button", { name: "Recreate course" });
    expect(confirm()).toBeDisabled();

    const input = screen.getByRole("textbox");
    // A near-miss must NOT enable it.
    fireEvent.change(input, { target: { value: "course-solana-10" } });
    expect(confirm()).toBeDisabled();

    // The exact id enables it.
    fireEvent.change(input, { target: { value: COURSE_ID } });
    expect(confirm()).not.toBeDisabled();
  });

  it("does not dismiss on a backdrop click (only explicit Cancel/Confirm)", async () => {
    await openModal(false);
    // The overlay is a presentation node wrapping the dialog; clicking it must
    // not close the modal.
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("RecreateCourseFlow — F4 unusual-creator acknowledgement (c)", () => {
  it("sends allowUnusualCreator + acknowledgeUnusualCreator ONLY after the second ack, and requires it to confirm", async () => {
    const { fetchMock } = await openModal(true);

    const confirm = () =>
      screen.getByRole("button", { name: "Recreate course" });
    const input = screen.getByRole("textbox");

    // Typing the id is necessary but NOT sufficient for an unusual creator.
    fireEvent.change(input, { target: { value: COURSE_ID } });
    expect(confirm()).toBeDisabled();

    // The second, separate acknowledgement unlocks it.
    fireEvent.click(screen.getByRole("checkbox"));
    expect(confirm()).not.toBeDisabled();

    fireEvent.click(confirm());

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(
        (c) => c[1] && (c[1] as { method?: string }).method === "POST"
      );
      expect(post).toBeTruthy();
    });

    const post = fetchMock.mock.calls.find(
      (c) => c[1] && (c[1] as { method?: string }).method === "POST"
    )!;
    const sent = JSON.parse((post[1] as { body: string }).body) as {
      courseId: string;
      confirm: string;
      allowUnusualCreator?: boolean;
      acknowledgeUnusualCreator?: string;
    };
    expect(sent.courseId).toBe(COURSE_ID);
    expect(sent.confirm).toBe(COURSE_ID);
    expect(sent.allowUnusualCreator).toBe(true);
    expect(sent.acknowledgeUnusualCreator).toBe(COURSE_ID);
  });

  it("a normal recreate sends NEITHER F4 field", async () => {
    const { fetchMock } = await openModal(false);

    // No unusual-creator section, so no checkbox is rendered.
    expect(screen.queryByRole("checkbox")).toBeNull();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: COURSE_ID },
    });
    fireEvent.click(screen.getByRole("button", { name: "Recreate course" }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(
        (c) => c[1] && (c[1] as { method?: string }).method === "POST"
      );
      expect(post).toBeTruthy();
    });

    const post = fetchMock.mock.calls.find(
      (c) => c[1] && (c[1] as { method?: string }).method === "POST"
    )!;
    const sent = JSON.parse((post[1] as { body: string }).body) as Record<
      string,
      unknown
    >;
    expect(sent.courseId).toBe(COURSE_ID);
    expect(sent.confirm).toBe(COURSE_ID);
    expect("allowUnusualCreator" in sent).toBe(false);
    expect("acknowledgeUnusualCreator" in sent).toBe(false);
  });
});

describe("RecreateCourseFlow — FIX 2 honest execute-failure recovery", () => {
  const INDETERMINATE =
    messages.admin.deployScreen.recreate.execError.indeterminateRecovery;
  const DOWN = messages.admin.deployScreen.recreate.execError.downRecovery;

  it("shows the 'refresh and check' message and NOT the Deploy banner on a network/indeterminate reject (no courseIntact)", async () => {
    await executeWith(() => Promise.reject(new Error("Failed to fetch")));

    // The indeterminate banner appears; the definitive "use Deploy" banner does not.
    await screen.findByText(INDETERMINATE);
    expect(screen.queryByText(DOWN)).toBeNull();
    // The raw network error is still surfaced.
    expect(screen.getByText("Failed to fetch")).toBeTruthy();
  });

  it("still shows the Deploy banner (and not the indeterminate one) when the server reports courseIntact:false", async () => {
    await executeWith(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: "close landed, create did not",
            phase: "create",
            courseIntact: false,
          }),
          { status: 500, headers: { "content-type": "application/json" } }
        )
      )
    );

    await screen.findByText(DOWN);
    expect(screen.queryByText(INDETERMINATE)).toBeNull();
  });
});
