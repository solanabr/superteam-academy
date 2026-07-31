import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    get GEMINI_API_KEY() {
      return process.env.GEMINI_API_KEY;
    },
    get SUPABASE_SERVICE_ROLE_KEY() {
      return process.env.SUPABASE_SERVICE_ROLE_KEY;
    },
  },
}));

const isRateLimited = vi.fn();
vi.mock("@/lib/rate-limit", () => ({ isRateLimited }));

// The reply now runs under the #591 ledger (#724). Mock the gate so the tests
// control the decision; degradedMaxTokens stays the real pure helper.
const checkAiSpend = vi.fn();
const recordAiSpend = vi.fn();
vi.mock("@/lib/ai/spend-ledger", () => ({
  checkAiSpend,
  recordAiSpend,
  degradedMaxTokens: (base: number) => Math.max(256, Math.floor(base / 2)),
}));

const INPUT = {
  userId: "user-1",
  ip: "203.0.113.7",
  prompt: "What did you build?",
  reflection: "A dApp.",
};

function stubGeminiFetch(text: string, ok = true, usageMetadata?: unknown) {
  const fetchMock = vi.fn(async () => ({
    ok,
    json: async () => ({
      candidates: [{ content: { parts: [{ text }] } }],
      ...(usageMetadata ? { usageMetadata } : {}),
    }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
  isRateLimited.mockResolvedValue(false);
  checkAiSpend.mockResolvedValue({ decision: "full" });
  recordAiSpend.mockResolvedValue(undefined);
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.OPENENDED_AI_REPLY = "1";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENENDED_AI_REPLY;
});

describe("maybeGenerateReflectionReply", () => {
  it("returns null and never calls the model when explicitly disabled (=0)", async () => {
    process.env.OPENENDED_AI_REPLY = "0";
    const fetchMock = stubGeminiFetch("should not run");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the 3.x thinkingLevel floor, never the 2.5-era thinkingBudget", async () => {
    // The 3.x models 400 INVALID_ARGUMENT on `thinkingBudget` — this exact
    // regression silently broke every AI turn after the #890 model swap.
    const fetchMock = stubGeminiFetch("Nice work");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    await maybeGenerateReflectionReply(INPUT);
    const body = JSON.parse(
      String(
        (fetchMock.mock.calls[0] as unknown[])[1] &&
          ((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body
      )
    ) as { generationConfig: { thinkingConfig: Record<string, unknown> } };
    expect(body.generationConfig.thinkingConfig).toEqual({
      thinkingLevel: "low",
    });
    expect(body.generationConfig.thinkingConfig).not.toHaveProperty(
      "thinkingBudget"
    );
  });

  it("calls the CHEAP routed model, not the old 3.5-flash pin (#868)", async () => {
    const fetchMock = stubGeminiFetch("Nice work");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    await maybeGenerateReflectionReply(INPUT);
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("models/gemini-3.5-flash-lite:generateContent");
    expect(url).not.toContain("models/gemini-3.5-flash:");
  });

  it("honours AI_MODEL_REFLECTION when it names a priced model", async () => {
    process.env.AI_MODEL_REFLECTION = "gemini-3.6-flash";
    const fetchMock = stubGeminiFetch("Nice work");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    await maybeGenerateReflectionReply(INPUT);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain(
      "models/gemini-3.6-flash:generateContent"
    );
    delete process.env.AI_MODEL_REFLECTION;
  });

  it("is ON by default — replies with the flag unset (#848)", async () => {
    delete process.env.OPENENDED_AI_REPLY;
    stubGeminiFetch("Default-on reply");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBe("Default-on reply");
  });

  it("returns null when GEMINI_API_KEY is unset", async () => {
    delete process.env.GEMINI_API_KEY;
    const fetchMock = stubGeminiFetch("should not run");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null (no model call) when the reply is rate limited", async () => {
    isRateLimited.mockResolvedValue(true);
    const fetchMock = stubGeminiFetch("should not run");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the model text when enabled and the call succeeds", async () => {
    stubGeminiFetch("Great reflection — keep going!");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBe(
      "Great reflection — keep going!"
    );
  });

  it("uses a FAIL-CLOSED reply limiter (#724)", async () => {
    stubGeminiFetch("hi");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    await maybeGenerateReflectionReply(INPUT);
    expect(isRateLimited).toHaveBeenCalledWith(
      "ai:reflection",
      "user-1",
      expect.objectContaining({ failClosed: true })
    );
  });

  it("returns null (no model call) when the limiter store throws (fail-closed)", async () => {
    isRateLimited.mockRejectedValue(new Error("store down"));
    const fetchMock = stubGeminiFetch("should not run");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("SKIPS the reply (null, no model call) when the spend cap denies", async () => {
    checkAiSpend.mockResolvedValue({ decision: "denied", reason: "spend_cap" });
    const fetchMock = stubGeminiFetch("should not run");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("SKIPS the reply when the ledger is unreachable (fail-closed via checkAiSpend)", async () => {
    // checkAiSpend fails closed on its own — a ledger outage resolves to
    // "denied"/ledger_unavailable, which the reply treats as skip. Never 503s
    // the seal (that lives in the route, unaffected).
    checkAiSpend.mockResolvedValue({
      decision: "denied",
      reason: "ledger_unavailable",
    });
    const fetchMock = stubGeminiFetch("should not run");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gates on account + IP + global via checkAiSpend(userId, ip)", async () => {
    stubGeminiFetch("hi");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    await maybeGenerateReflectionReply(INPUT);
    expect(checkAiSpend).toHaveBeenCalledWith("user-1", "203.0.113.7");
  });

  it("degrades to a shorter output budget over a soft cap (still replies)", async () => {
    checkAiSpend.mockResolvedValue({ decision: "degraded" });
    const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
      void init;
      return {
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: "shorter but present" }] } },
          ],
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    const reply = await maybeGenerateReflectionReply(INPUT);
    expect(reply).toBe("shorter but present");
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body) as {
      generationConfig: { maxOutputTokens: number };
    };
    // 512 -> degradedMaxTokens(512) = 256.
    expect(body.generationConfig.maxOutputTokens).toBe(256);
  });

  it("records the spend on a successful billed reply (usageMetadata → ledger)", async () => {
    const usageMetadata = {
      promptTokenCount: 300,
      candidatesTokenCount: 120,
    };
    stubGeminiFetch("Great reflection!", true, usageMetadata);
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    await maybeGenerateReflectionReply(INPUT);
    expect(recordAiSpend).toHaveBeenCalledWith(
      "user-1",
      "203.0.113.7",
      "gemini-3.5-flash-lite",
      usageMetadata,
      { promptTokens: 3000, outputTokens: 512 }
    );
  });

  it("still books spend with a conservative fallback when usageMetadata is absent", async () => {
    stubGeminiFetch("Great reflection!"); // no usageMetadata
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    await maybeGenerateReflectionReply(INPUT);
    // usage undefined, but the conservative fallback shape is still passed so
    // recordAiSpend books a non-zero estimate rather than $0.
    expect(recordAiSpend).toHaveBeenCalledWith(
      "user-1",
      "203.0.113.7",
      "gemini-3.5-flash-lite",
      undefined,
      { promptTokens: 3000, outputTokens: 512 }
    );
  });

  it("does NOT record spend when the model call was not billed (non-ok)", async () => {
    stubGeminiFetch("", false);
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    await maybeGenerateReflectionReply(INPUT);
    expect(recordAiSpend).not.toHaveBeenCalled();
  });

  it("returns null when the model call is not ok", async () => {
    stubGeminiFetch("", false);
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network down");
      })
    );
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBeNull();
  });

  it("returns null when the model call exceeds the timeout (aborts)", async () => {
    vi.useFakeTimers();
    // A never-resolving upstream that only settles when the abort signal fires.
    const fetchMock = vi.fn(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError"))
          );
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");

    const pending = maybeGenerateReflectionReply(INPUT);
    // Drive past the 10s hard timeout; the fetch aborts and the reply degrades.
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(pending).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
