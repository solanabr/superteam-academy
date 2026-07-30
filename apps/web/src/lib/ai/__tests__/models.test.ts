import { describe, it, expect, afterEach, vi } from "vitest";
import {
  GEMINI_MODELS,
  MODEL_RATES,
  isGeminiModel,
  modelForAction,
  modelForReflectionReply,
  geminiUrl,
} from "../models";

const MODEL_ENV_VARS = [
  "AI_MODEL_HINT",
  "AI_MODEL_ASK",
  "AI_MODEL_PROPOSE",
  "AI_MODEL_REVIEW",
  "AI_MODEL_SOCRATIC",
  "AI_MODEL_REFLECTION",
] as const;

afterEach(() => {
  for (const name of MODEL_ENV_VARS) delete process.env[name];
  vi.restoreAllMocks();
});

describe("per-action routing (#868)", () => {
  it("routes hint to flash-lite and ask/propose to 3.6-flash", () => {
    expect(modelForAction("hint")).toBe("gemini-3.5-flash-lite");
    expect(modelForAction("ask")).toBe("gemini-3.6-flash");
    expect(modelForAction("propose")).toBe("gemini-3.6-flash");
  });

  it("routes review with ask (same quality shape, not the cheap tier)", () => {
    expect(modelForAction("review")).toBe("gemini-3.6-flash");
  });

  it("never routes to the old pinned model by default", () => {
    for (const action of ["hint", "ask", "propose", "review"] as const) {
      expect(modelForAction(action)).not.toBe("gemini-3.5-flash");
    }
  });
});

describe("Socratic override (#887 §4.4)", () => {
  it("forces flash-lite for Socratic-tier hint AND ask turns", () => {
    expect(modelForAction("hint", { socratic: true })).toBe(
      "gemini-3.5-flash-lite"
    );
    // ask normally routes to 3.6-flash — the Socratic contract overrides it.
    expect(modelForAction("ask", { socratic: true })).toBe(
      "gemini-3.5-flash-lite"
    );
  });

  it("leaves propose and review on the quality tier at every ladder tier", () => {
    // §4.2: propose keeps its full diff contract in the Socratic tier; review is
    // post-pass and unaffected.
    expect(modelForAction("propose", { socratic: true })).toBe(
      "gemini-3.6-flash"
    );
    expect(modelForAction("review", { socratic: true })).toBe(
      "gemini-3.6-flash"
    );
  });

  it("is a no-op when socratic is false/absent", () => {
    expect(modelForAction("ask", { socratic: false })).toBe("gemini-3.6-flash");
    expect(modelForAction("ask")).toBe("gemini-3.6-flash");
  });
});

describe("reflection reply routing", () => {
  it("routes the bounded 512-token reply to the cheap tier", () => {
    expect(modelForReflectionReply()).toBe("gemini-3.5-flash-lite");
  });
});

describe("env overrides", () => {
  it("lets a per-action var override the coded default", () => {
    process.env.AI_MODEL_HINT = "gemini-3.6-flash";
    expect(modelForAction("hint")).toBe("gemini-3.6-flash");
    // Other actions are untouched.
    expect(modelForAction("propose")).toBe("gemini-3.6-flash");
    expect(modelForAction("hint", { socratic: true })).toBe(
      "gemini-3.5-flash-lite"
    );
  });

  it("lets AI_MODEL_SOCRATIC override only the Socratic path", () => {
    process.env.AI_MODEL_SOCRATIC = "gemini-3.5-flash";
    expect(modelForAction("hint", { socratic: true })).toBe("gemini-3.5-flash");
    expect(modelForAction("hint")).toBe("gemini-3.5-flash-lite");
  });

  it("lets AI_MODEL_REFLECTION override the reflection reply", () => {
    process.env.AI_MODEL_REFLECTION = "gemini-3.6-flash";
    expect(modelForReflectionReply()).toBe("gemini-3.6-flash");
  });

  it("IGNORES an unpriced/garbage model and warns (the ledger must stay honest)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.AI_MODEL_ASK = "gemini-9.9-imaginary";
    expect(modelForAction("ask")).toBe("gemini-3.6-flash");
    expect(warn).toHaveBeenCalled();
  });

  it("treats a blank value as unset", () => {
    process.env.AI_MODEL_ASK = "";
    expect(modelForAction("ask")).toBe("gemini-3.6-flash");
  });
});

describe("price sheet + url", () => {
  it("prices every routable model (no model can be routed unpriced)", () => {
    for (const model of GEMINI_MODELS) {
      expect(MODEL_RATES[model].inputUsdPerMTok).toBeGreaterThan(0);
      expect(MODEL_RATES[model].outputUsdPerMTok).toBeGreaterThan(0);
    }
  });

  it("builds the generateContent endpoint for the routed model", () => {
    expect(geminiUrl("gemini-3.5-flash-lite")).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"
    );
  });

  it("recognises exactly the priced models", () => {
    expect(isGeminiModel("gemini-3.6-flash")).toBe(true);
    expect(isGeminiModel("gemini-2.5-flash-lite")).toBe(false);
  });
});
