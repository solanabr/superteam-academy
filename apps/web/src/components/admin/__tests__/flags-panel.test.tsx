// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { FlagsPanel } from "../flags-panel";

const flag = {
  id: "flag-1",
  reason: "spam",
  details: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  reporter: "alice",
  targetType: "thread" as const,
  preview: "reported post",
  body: "the whole reported post, in full",
  url: null,
};

function renderPanel() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <FlagsPanel />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const flagsMsgs = messages.admin.flags;

/** A `fetch` that never settles, so the panel stays in its loading state. */
function pendingFetch() {
  const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// #1132: the queue used to initialise to `[]` with no loading state and
// swallow every load failure, so "No pending flags." was what a moderator saw
// whether the queue was clear, still loading, or unreachable.
describe("FlagsPanel load states", () => {
  it("shows the loading state — not the empty state — before the fetch settles", () => {
    pendingFetch();
    renderPanel();

    expect(screen.getByText(flagsMsgs.loading)).toBeInTheDocument();
    expect(screen.queryByText(flagsMsgs.noPending)).not.toBeInTheDocument();
    // Loading is a polite status, never an alert.
    expect(screen.getByRole("status")).toHaveTextContent(flagsMsgs.loading);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the empty state only once a successful fetch returns no flags", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ flags: [] }) })
    );
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.noPending)).toBeInTheDocument()
    );
    expect(screen.queryByText(flagsMsgs.loading)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does NOT render the empty state when the load fails with a 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.loadErrorFetch)).toBeInTheDocument()
    );
    expect(screen.queryByText(flagsMsgs.noPending)).not.toBeInTheDocument();
    expect(screen.queryByText(flagsMsgs.loading)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      flagsMsgs.loadErrorFetch
    );
  });

  it("does NOT render the empty state when the load fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.loadErrorNetwork)).toBeInTheDocument()
    );
    expect(screen.queryByText(flagsMsgs.noPending)).not.toBeInTheDocument();
  });

  it("tells the moderator the session expired when the load 401s", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    );
    renderPanel();

    await waitFor(() =>
      expect(
        screen.getByText(flagsMsgs.loadErrorUnauthorized)
      ).toBeInTheDocument()
    );
    // A 401 is not the generic fetch failure — different cause, different fix.
    expect(
      screen.queryByText(flagsMsgs.loadErrorFetch)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(flagsMsgs.noPending)).not.toBeInTheDocument();
  });

  it("retries the load from the failed state and renders the recovered queue", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ flags: [flag] }),
      });
    vi.stubGlobal("fetch", fetchMock);
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.loadErrorFetch)).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getByRole("button", { name: messages.admin.states.retry })
    );

    await waitFor(() =>
      expect(screen.getByText(flag.preview)).toBeInTheDocument()
    );
    expect(
      screen.queryByText(flagsMsgs.loadErrorFetch)
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports the loaded count to the parent badge", async () => {
    const onCountChange = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ flags: [flag] }) })
    );
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <FlagsPanel onCountChange={onCountChange} />
      </NextIntlClientProvider>
    );

    await waitFor(() => expect(onCountChange).toHaveBeenLastCalledWith(1));
  });
});

describe("FlagsPanel action-error paths", () => {
  it("shows the localized fetch-error string (not the raw server message) on a non-ok action", async () => {
    const fetchMock = vi
      .fn()
      // initial load (GET)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ flags: [flag] }),
      })
      // resolve action (POST) — server sends a raw error we must not surface
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "boom: internal DB error" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(messages.admin.flags.resolve)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(messages.admin.flags.resolve));

    await waitFor(() =>
      expect(
        screen.getByText(messages.admin.flags.errorFetch)
      ).toBeInTheDocument()
    );
    // The raw server message stays out of the DOM (console-only for devtools).
    expect(
      screen.queryByText(/boom: internal DB error/)
    ).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("shows the localized network-error string when the action fetch throws", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ flags: [flag] }),
      })
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(messages.admin.flags.dismiss)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(messages.admin.flags.dismiss));

    await waitFor(() =>
      expect(
        screen.getByText(messages.admin.flags.errorNetwork)
      ).toBeInTheDocument()
    );
    expect(screen.queryByText(/offline/)).not.toBeInTheDocument();
  });
});

// #1131: the card can now action the reported CONTENT, not just the report.
const answerFlag = {
  ...flag,
  id: "flag-2",
  targetType: "answer" as const,
  preview: "reported answer",
  body: "the whole reported answer",
};

/** GET returns `flags`; every later POST gets `actionResponse`. */
function panelWith(
  flags: unknown[],
  actionResponse: Record<string, unknown> = {}
) {
  const fetchMock = vi.fn().mockImplementation((_url, init?: RequestInit) =>
    init?.method === "POST"
      ? Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, audited: true }),
          ...actionResponse,
        })
      : Promise.resolve({ ok: true, json: async () => ({ flags }) })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function postBodies(fetchMock: ReturnType<typeof vi.fn>): unknown[] {
  return fetchMock.mock.calls
    .filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")
    .map(
      ([, init]) => JSON.parse(String((init as RequestInit).body)) as unknown
    );
}

describe("FlagsPanel remove — destructive, so it takes two clicks", () => {
  it("does NOT post on the first Remove click", async () => {
    const fetchMock = panelWith([flag]);
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.remove)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(flagsMsgs.remove));

    expect(postBodies(fetchMock)).toEqual([]);
    expect(
      screen.getByText(messages.community.confirmDelete)
    ).toBeInTheDocument();
  });

  it("posts action:remove once confirmed", async () => {
    const fetchMock = panelWith([flag]);
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.remove)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(flagsMsgs.remove));
    fireEvent.click(screen.getByText(messages.community.delete));

    await waitFor(() =>
      expect(postBodies(fetchMock)).toEqual([
        { flagId: "flag-1", action: "remove" },
      ])
    );
    // The actioned flag leaves the queue.
    await waitFor(() =>
      expect(screen.queryByText(flag.preview)).not.toBeInTheDocument()
    );
  });

  it("cancel disarms the confirm without posting", async () => {
    const fetchMock = panelWith([flag]);
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.remove)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(flagsMsgs.remove));
    fireEvent.click(screen.getByText(messages.community.cancel));

    expect(postBodies(fetchMock)).toEqual([]);
    expect(screen.getByText(flagsMsgs.remove)).toBeInTheDocument();
    expect(screen.getByText(flag.preview)).toBeInTheDocument();
  });

  it("tells the moderator to reload when the content is already gone (409)", async () => {
    panelWith([flag], {
      ok: false,
      status: 409,
      json: async () => ({ error: "Content already removed" }),
    });
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.remove)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(flagsMsgs.remove));
    fireEvent.click(screen.getByText(messages.community.delete));

    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.errorConflict)).toBeInTheDocument()
    );
    // A conflict is not the generic retry-me failure.
    expect(screen.queryByText(flagsMsgs.errorFetch)).not.toBeInTheDocument();
    // …and the flag stays in the queue, since nothing was decided.
    expect(screen.getByText(flag.preview)).toBeInTheDocument();
  });

  it("surfaces a rate-limit refusal as its own message", async () => {
    panelWith([flag], {
      ok: false,
      status: 429,
      json: async () => ({ error: "Too many requests" }),
    });
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.remove)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(flagsMsgs.remove));
    fireEvent.click(screen.getByText(messages.community.delete));

    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.errorRateLimited)).toBeInTheDocument()
    );
  });

  it("warns when the action landed but was not audited", async () => {
    panelWith([flag], {
      json: async () => ({ success: true, audited: false }),
    });
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.remove)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(flagsMsgs.remove));
    fireEvent.click(screen.getByText(messages.community.delete));

    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.auditWarning)).toBeInTheDocument()
    );
  });
});

describe("FlagsPanel lock — thread-only, non-terminal", () => {
  it("offers Lock on a thread report and keeps the card after locking", async () => {
    const fetchMock = panelWith([flag]);
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.lock)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(flagsMsgs.lock));

    await waitFor(() =>
      expect(postBodies(fetchMock)).toEqual([
        { flagId: "flag-1", action: "lock" },
      ])
    );
    // A lock does not settle the report, so the card stays…
    expect(screen.getByText(flag.preview)).toBeInTheDocument();
    // …and the button stops offering a no-op.
    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.locked)).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: flagsMsgs.locked })
    ).toBeDisabled();
  });

  it("offers no Lock on an answer report — there is no thread of its own", async () => {
    panelWith([answerFlag]);
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText(answerFlag.preview)).toBeInTheDocument()
    );

    expect(screen.queryByText(flagsMsgs.lock)).not.toBeInTheDocument();
    // Remove is still available on an answer.
    expect(screen.getByText(flagsMsgs.remove)).toBeInTheDocument();
  });
});

describe("FlagsPanel link-less cards expose the content", () => {
  it("renders the full body in an expandable block when there is no link", async () => {
    panelWith([flag]);
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.showContent)).toBeInTheDocument()
    );
    expect(screen.getByText(flag.body)).toBeInTheDocument();
    expect(screen.queryByText(flagsMsgs.view)).not.toBeInTheDocument();
  });

  it("links out instead when the target URL resolved", async () => {
    panelWith([{ ...flag, url: "/en/community/general/reported-title-ab12" }]);
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.view)).toBeInTheDocument()
    );
    expect(screen.getByText(flagsMsgs.view)).toHaveAttribute(
      "href",
      "/en/community/general/reported-title-ab12"
    );
    expect(screen.queryByText(flagsMsgs.showContent)).not.toBeInTheDocument();
  });

  it("says so rather than rendering an empty block when the body is missing too", async () => {
    panelWith([{ ...flag, body: "" }]);
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText(flagsMsgs.contentUnavailable)).toBeInTheDocument()
    );
  });
});
