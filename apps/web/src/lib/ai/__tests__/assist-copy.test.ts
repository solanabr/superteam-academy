// #864 copy guard: the assist ladder is degrade-never-block, and its copy must
// NEVER be paywall-shaped (economics spec §4.4, the Prodigy pattern): no
// buy/purchase/upgrade language in any locale, and — owner D-5 — the Socratic
// tier is never framed as "unlimited". A literal scan of the aiPartner message
// subtree in all three catalogs, so a future copy edit that drifts toward a
// paywall shape fails CI instead of shipping.
import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";

const CATALOGS = { en, es, "pt-BR": ptBR } as const;

// Word-boundary tokens per language family. Kept deliberately literal — this
// is a tripwire, not NLP. "pay"/"paid" are included: the learner-facing copy
// talks about turns and assists, never about payment (the free/metered split
// is an internal billing detail, #770).
const FORBIDDEN: RegExp[] = [
  /\bbuy(s|ing)?\b/i,
  /\bpurchase(s|d)?\b/i,
  /\bupgrade(s|d)?\b/i,
  /\bpremium\b/i,
  /\bpaywall\b/i,
  /\bpay(s|ing|ment)?\b/i,
  /\bpaid\b/i,
  /\bsubscri(be|ption)\b/i,
  // D-5: nothing in the ladder is "unlimited" — en/es/pt.
  /\bunlimited\b/i,
  /\bilimitad[oa]s?\b/i,
  // es/pt purchase/payment verbs.
  /\bcomprar?\b/i,
  /\bcompra(s)?\b/i,
  /\bpag(ar|o|amento|amentos)\b/i,
  /\bassinatura\b/i,
  /\bsuscripci[oó]n\b/i,
];

function flatten(node: unknown, path: string): Array<[string, string]> {
  if (typeof node === "string") return [[path, node]];
  if (node && typeof node === "object") {
    return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
      flatten(v, path ? `${path}.${k}` : k)
    );
  }
  return [];
}

describe("#864 aiPartner copy is never paywall-shaped", () => {
  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    it(`${locale}: no buy/purchase/upgrade/unlimited wording anywhere in aiPartner`, () => {
      const strings = flatten(
        (catalog as { aiPartner: unknown }).aiPartner,
        "aiPartner"
      );
      expect(strings.length).toBeGreaterThan(0);
      const violations = strings.filter(([, text]) =>
        FORBIDDEN.some((re) => re.test(text))
      );
      expect(violations).toEqual([]);
    });

    it(`${locale}: ships the full exhaustion/handoff + Socratic + meter key set`, () => {
      const ai = (
        catalog as {
          aiPartner: {
            meter: Record<string, string>;
            socratic: Record<string, string>;
            exhausted: Record<string, string>;
          };
        }
      ).aiPartner;
      expect(Object.keys(ai.meter).sort()).toEqual(["metered", "socratic"]);
      // `entered` is gone with the Socratic banner (owner 2026-07-31): the tier
      // shift is announced by the meter chip alone.
      expect(Object.keys(ai.socratic).sort()).toEqual(["chip"]);
      expect(Object.keys(ai.exhausted).sort()).toEqual([
        "body",
        "communityCta",
        "resetCooldown",
        "resetCta",
        "resetError",
        "resetReady",
        "resetUsed",
        "title",
      ]);
    });
  }
});
