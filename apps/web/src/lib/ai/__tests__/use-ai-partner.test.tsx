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
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useAiPartner", () => {
  it("serves the first two requestHint() calls from authored hints with no fetch", async () => {
    const { result } = renderHook(() => useAiPartner(baseProps()));

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

    const { result } = renderHook(() => useAiPartner(baseProps()));

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

    const { result } = renderHook(
      () => useAiPartner(baseProps({ hints: [] })) // no authored hints -> requestHint always pays
    );

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
        correctIndex: 1,
        explanation: "Because B.",
      },
    };
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(response));

    const { result } = renderHook(() => useAiPartner(baseProps()));

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

    const { result } = renderHook(() => useAiPartner(baseProps()));

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

    const { result } = renderHook(() => useAiPartner(baseProps()));

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

    const { result } = renderHook(() => useAiPartner(baseProps()));

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

    const { result } = renderHook(() =>
      useAiPartner(baseProps({ hints: [HINTS[0]!] }))
    );

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
});
