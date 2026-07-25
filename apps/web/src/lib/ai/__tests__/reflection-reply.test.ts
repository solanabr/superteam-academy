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

const INPUT = {
  userId: "user-1",
  prompt: "What did you build?",
  reflection: "A dApp.",
};

function stubGeminiFetch(text: string, ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
  isRateLimited.mockResolvedValue(false);
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.OPENENDED_AI_REPLY = "1";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENENDED_AI_REPLY;
});

describe("maybeGenerateReflectionReply", () => {
  it("returns null and never calls the model when the flag is off", async () => {
    delete process.env.OPENENDED_AI_REPLY;
    const fetchMock = stubGeminiFetch("should not run");
    const { maybeGenerateReflectionReply } =
      await import("../reflection-reply");
    expect(await maybeGenerateReflectionReply(INPUT)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
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
});
