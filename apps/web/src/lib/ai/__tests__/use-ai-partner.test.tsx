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
  it("rehydrates the persisted chat log + ladder counts on mount (no paid call)", async () => {
    const stored = [
      { role: "user", text: "why does this fail?" },
      { role: "ai", response: { type: "answer", text: "off-by-one." } },
    ];
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({
        log: stored,
        counts: { free: 2, metered: 3, socratic: 0 },
        resetState: "cooldown",
        resetAvailableAt: 1_700_000_000_000,
      })
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
    expect(result.current.counts).toEqual({ free: 2, metered: 3, socratic: 0 });
    expect(result.current.tier).toBe("metered");
    expect(result.current.resetState).toBe("cooldown");
    expect(result.current.resetAvailableAt).toBe(1_700_000_000_000);
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

    expect(result.current.counts).toEqual({ free: 1, metered: 0, socratic: 0 });
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2]).toMatchObject({
      role: "ai",
      response: { type: "hint", text: "Server-generated hint." },
    });
  });

  it("flips budgetExhausted and syncs counts when the route reports the ladder spent", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({
        budgetExhausted: true,
        counts: { free: 2, metered: 8, socratic: 20 },
      })
    );

    // no authored hints -> requestHint always pays
    const { result } = await renderPartner(baseProps({ hints: [] }));

    await act(async () => {
      await result.current.requestHint();
    });

    expect(result.current.budgetExhausted).toBe(true);
    expect(result.current.tier).toBe("exhausted");
    expect(result.current.counts).toEqual({
      free: 2,
      metered: 8,
      socratic: 20,
    });
  });

  it("proposeFix() POSTs action:propose and pushes the structured response", async () => {
    const response: PartnerResponse = {
      type: "propose",
      rationale: "Fixes the off-by-one.",
      edits: [{ search: "let x = 1;", replace: "let x = 2;" }],
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
    expect(result.current.counts).toEqual({ free: 1, metered: 0, socratic: 0 });
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

  it("review() POSTs action:review and pushes the structured review response", async () => {
    const response: PartnerResponse = {
      type: "review",
      summary: "Passes and reads clearly.",
      notes: ["Use iter().sum()."],
    };
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(response));

    const { result } = await renderPartner();

    await act(async () => {
      await result.current.review();
    });

    const [url, init] = vi.mocked(global.fetch).mock.calls[0]!;
    expect(url).toBe("/api/ai/partner");
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody.action).toBe("review");
    // review carries no local user turn — only the AI reply lands in the chat.
    expect(result.current.counts).toEqual({ free: 1, metered: 0, socratic: 0 });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({ role: "ai", response });
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
    expect(result.current.counts).toEqual({ free: 0, metered: 0, socratic: 0 });
    expect(result.current.loading).toBe(false);
  });

  it("flips spendCapped (not error) on a 503 with spendCapped, without paying", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ spendCapped: true, reason: "spend_cap" }),
    } as Response);

    const { result } = await renderPartner(baseProps({ hints: [] }));

    await act(async () => {
      await result.current.requestHint();
    });

    expect(result.current.spendCapped).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.counts).toEqual({ free: 0, metered: 0, socratic: 0 });
  });

  it("shows the generic error (not spendCapped) on a 503 that is not a spend cap", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: "AI partner not configured" }),
    } as Response);

    const { result } = await renderPartner(baseProps({ hints: [] }));

    await act(async () => {
      await result.current.requestHint();
    });

    expect(result.current.spendCapped).toBe(false);
    expect(result.current.error).toBeTruthy();
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

  it("advances counts in ladder order: free -> metered -> socratic (tier boundaries at turns 3 and 11)", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ type: "answer", text: "ok" })
    );

    const { result } = await renderPartner(baseProps({ hints: [] }));

    // Turns 1-2 land in the hidden free tier.
    for (let i = 0; i < 2; i++) {
      await act(async () => {
        await result.current.requestHint();
      });
    }
    expect(result.current.counts).toEqual({ free: 2, metered: 0, socratic: 0 });
    expect(result.current.tier).toBe("metered"); // NEXT turn is metered (turn 3)

    // Turns 3-10 land in the metered tier.
    for (let i = 0; i < 8; i++) {
      await act(async () => {
        await result.current.requestHint();
      });
    }
    expect(result.current.counts).toEqual({ free: 2, metered: 8, socratic: 0 });
    expect(result.current.tier).toBe("socratic"); // NEXT turn is Socratic (turn 11)

    // Turns 11-30 land in the Socratic tier; turn 31 would be the handoff.
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await result.current.requestHint();
      });
    }
    expect(result.current.counts).toEqual({
      free: 2,
      metered: 8,
      socratic: 20,
    });
    expect(result.current.tier).toBe("exhausted");
    expect(result.current.budgetExhausted).toBe(true);
  });

  describe("requestReset", () => {
    it("POSTs to the reset route and zeroes the local ladder on an allowed reset", async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        jsonResponse({ allowed: true, reason: "reset", availableAt: null })
      );

      const { result } = await renderPartner(baseProps({ hints: [] }));

      const outcome = await act(async () => result.current.requestReset());

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ai/partner/reset",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ courseSlug: "c-slug", lessonSlug: "l-slug" }),
        })
      );
      expect(outcome).toEqual({
        allowed: true,
        reason: "reset",
        availableAt: null,
      });
      expect(result.current.counts).toEqual({
        free: 0,
        metered: 0,
        socratic: 0,
      });
      expect(result.current.budgetExhausted).toBe(false);
      // Honest state: the one-time reset is now spent.
      expect(result.current.resetState).toBe("used");
    });

    it("relays a cooldown denial (with availableAt) without touching counts", async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        jsonResponse({
          allowed: false,
          reason: "cooldown",
          availableAt: 1_700_000_000_000,
        })
      );

      const { result } = await renderPartner(baseProps({ hints: [] }));

      const outcome = await act(async () => result.current.requestReset());

      expect(outcome.allowed).toBe(false);
      expect(outcome.reason).toBe("cooldown");
      expect(result.current.resetState).toBe("cooldown");
      expect(result.current.resetAvailableAt).toBe(1_700_000_000_000);
    });

    it("fails safe (denied) when the fetch throws", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("network down"));

      const { result } = await renderPartner(baseProps({ hints: [] }));

      const outcome = await act(async () => result.current.requestReset());
      expect(outcome).toEqual({
        allowed: false,
        reason: "error",
        availableAt: null,
      });
    });
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
