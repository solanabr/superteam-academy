// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAiPartner } from "../use-ai-partner";
import type { PartnerResponse } from "../partner-types";

const HINTS = ["Check your loop bound.", "Off-by-one on the last index."];

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

function baseProps(
  overrides: Partial<Parameters<typeof useAiPartner>[0]> = {}
) {
  return {
    lessonSlug: "l-slug",
    courseSlug: "c-slug",
    hints: HINTS,
    getCode: () => "let x = 1;",
    getTestSummary: () => "1/2 passing",
    ...overrides,
  };
}

beforeEach(() => {
  // Default: the on-mount rehydrate GET (/api/ai/partner/log) resolves to an
  // empty log. Individual tests override with mockResolvedValue for their
  // action fetch (mockClear in renderPartner keeps that implementation).
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => jsonResponse({ log: [], paidUsed: 0 }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// Renders the hook and flushes the on-mount rehydrate fetch
// (GET /api/ai/partner/log), then clears the fetch mock so each test's
// assertions only see the action fetches that follow — not the rehydrate call.
async function renderPartner(
  props: Parameters<typeof useAiPartner>[0] = baseProps()
) {
  const view = renderHook(() => useAiPartner(props));
  await act(async () => {});
  vi.mocked(global.fetch).mockClear();
  return view;
}

describe("useAiPartner", () => {
  it("rehydrates the persisted chat log + paidUsed on mount (no paid call)", async () => {
    const stored = [
      { role: "user", text: "why does this fail?" },
      { role: "ai", response: { type: "answer", text: "off-by-one." } },
    ];
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ log: stored, paidUsed: 2 })
    );

    const { result } = renderHook(() => useAiPartner(baseProps()));

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/ai/partner/log?courseSlug=c-slug&lessonSlug=l-slug"
    );
    expect(result.current.messages[0]).toMatchObject({
      role: "user",
      text: "why does this fail?",
    });
    expect(result.current.paidUsed).toBe(2);
  });

  it("serves the first two requestHint() calls from authored hints with no fetch", async () => {
    const { result } = await renderPartner();

    await act(async () => {
      result.current.requestHint();
    });
    expect(result.current.freeHintsUsed).toBe(1);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      role: "ai",
      kind: "hint",
      text: HINTS[0],
    });

    await act(async () => {
      result.current.requestHint();
    });
    expect(result.current.freeHintsUsed).toBe(2);
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      role: "ai",
      kind: "hint",
      text: HINTS[1],
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls fetch with action:hint once authored hints are exhausted", async () => {
    const response: PartnerResponse = {
      type: "hint",
      text: "Server-generated hint.",
    };
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(response));

    const { result } = await renderPartner();

    // Drain the two free hints first (no network).
    await act(async () => {
      result.current.requestHint();
    });
    await act(async () => {
      result.current.requestHint();
    });
    expect(global.fetch).not.toHaveBeenCalled();

    // Third call must hit the network.
    await act(async () => {
      await result.current.requestHint();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(global.fetch).mock.calls[0]!;
    expect(url).toBe("/api/ai/partner");
    expect(init).toMatchObject({ method: "POST" });
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody).toMatchObject({
      lessonSlug: "l-slug",
      courseSlug: "c-slug",
      action: "hint",
      code: "let x = 1;",
      testSummary: "1/2 passing",
    });
    // Stateless: no chat-history field is sent.
    expect(sentBody).not.toHaveProperty("messages");
    expect(sentBody).not.toHaveProperty("history");

    expect(result.current.paidUsed).toBe(1);
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2]).toMatchObject({
      role: "ai",
      response: { type: "hint", text: "Server-generated hint." },
    });
  });

  it("flips budgetExhausted and zeroes paidRemaining when the route reports the budget spent", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ budgetExhausted: true, used: 4 })
    );

    // no authored hints -> requestHint always pays
    const { result } = await renderPartner(baseProps({ hints: [] }));

    await act(async () => {
      await result.current.requestHint();
    });

    expect(result.current.budgetExhausted).toBe(true);
    expect(result.current.paidUsed).toBe(4);
    expect(result.current.paidRemaining).toBe(0);
  });

  it("proposeFix() POSTs action:propose and pushes the structured response", async () => {
    const response: PartnerResponse = {
      type: "propose",
      rationale: "Fixes the off-by-one.",
      proposedCode: "let x = 2;",
      check: {
        question: "Why?",
        options: ["A", "B", "C"],
      },
      checkToken: "sealed-token",
    };
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(response));

    const { result } = await renderPartner();

    await act(async () => {
      await result.current.proposeFix();
    });

    const [, init] = vi.mocked(global.fetch).mock.calls[0]!;
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody.action).toBe("propose");
    expect(result.current.paidUsed).toBe(1);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      role: "ai",
      response,
    });
  });

  it("ask(message) POSTs action:ask with the message and pushes a user message locally", async () => {
    const response: PartnerResponse = {
      type: "answer",
      text: "Here's why.",
    };
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(response));

    const { result } = await renderPartner();

    await act(async () => {
      await result.current.ask("why does this fail?");
    });

    const [, init] = vi.mocked(global.fetch).mock.calls[0]!;
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody).toMatchObject({
      action: "ask",
      message: "why does this fail?",
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({
      role: "user",
      text: "why does this fail?",
    });
    expect(result.current.messages[1]).toMatchObject({
      role: "ai",
      response,
    });
  });

  it("sets loading true during a paid fetch and false after it resolves", async () => {
    let resolveFetch!: (value: Response) => void;
    vi.mocked(global.fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { result } = await renderPartner();

    expect(result.current.loading).toBe(false);

    let callPromise!: Promise<void>;
    act(() => {
      callPromise = result.current.proposeFix();
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveFetch(jsonResponse({ type: "answer", text: "done" }));
      await callPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it("sets error on network failure and does not increment paidUsed", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("network down"));

    const { result } = await renderPartner();

    await act(async () => {
      await result.current.ask("help?");
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.paidUsed).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it("requestHint() pays immediately when hints ladder is shorter than 2", async () => {
    const response: PartnerResponse = { type: "hint", text: "paid hint" };
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(response));

    const { result } = await renderPartner(baseProps({ hints: [HINTS[0]!] }));

    await act(async () => {
      result.current.requestHint();
    });
    expect(result.current.freeHintsUsed).toBe(1);
    expect(global.fetch).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.requestHint();
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, init] = vi.mocked(global.fetch).mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string).action).toBe(
      "hint"
    );
  });

  describe("verifyCheck", () => {
    it("POSTs to the verify route and returns the parsed result", async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        jsonResponse({ correct: true, explanation: "because B" })
      );

      const { result } = await renderPartner();

      const verdict = await result.current.verifyCheck("tok", 1);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ai/partner/verify",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ checkToken: "tok", pickedIndex: 1 }),
        })
      );
      expect(verdict).toEqual({ correct: true, explanation: "because B" });
    });

    it("fails SAFE (correct:false) on a non-ok response, never auto-accepting", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "invalid check" }),
      } as Response);

      const { result } = await renderPartner();

      const verdict = await result.current.verifyCheck("tok", 1);

      expect(verdict).toEqual({ correct: false, explanation: "" });
    });

    it("fails SAFE (correct:false) when the fetch itself throws", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("network down"));

      const { result } = await renderPartner();

      const verdict = await result.current.verifyCheck("tok", 0);

      expect(verdict).toEqual({ correct: false, explanation: "" });
    });
  });
});
