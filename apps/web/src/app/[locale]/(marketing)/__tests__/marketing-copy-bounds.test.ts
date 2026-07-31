// #874 copy guard: the Brazil-payments wedge may state the stablecoin SHARE of
// Brazilian crypto volume (personalization research D7, attributed + dated) and
// nothing else about the Brazilian market. Two bright lines, both from the
// unified spec:
//
//   MAS-24  — never publish a Brazil earnings/market TOTAL we have not
//             verified (the $318.8B figure is window-bound; the +207.7% YoY and
//             $650B figures are unverified). No currency totals in marketing copy.
//   BCB-561 — never ship remittance framing; C5's compliance boundary applies
//             to marketing copy too.
//
// A literal scan of the marketing message subtrees in all three catalogs, so a
// future copy edit that drifts across either line fails CI instead of shipping.
import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";

const CATALOGS = { en, es, "pt-BR": ptBR } as const;

/** Namespaces that render on public marketing surfaces. */
const MARKETING_NAMESPACES = ["landing"] as const;

const FORBIDDEN: Array<[string, RegExp]> = [
  // MAS-24: any currency amount at all. The wedge argues with a share, not a total.
  ["currency amount", /(?:US\$|R\$|\$|€)\s?\d/],
  ["written currency total", /\d+(?:[.,]\d+)?\s*(?:bn|billion|trillion)\b/i],
  [
    "written currency total (pt/es)",
    /\d+(?:[.,]\d+)?\s*(?:bilh(?:ão|ões)|trilh(?:ão|ões)|mil millones|billones)\b/i,
  ],
  // BCB-561: remittance framing, en/pt/es.
  ["remittance framing", /\bremittance(s)?\b/i],
  ["remittance framing (pt)", /\bremessa(s)?\b/i],
  ["remittance framing (es)", /\bremesa(s)?\b/i],
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

describe("marketing copy bounds (MAS-24 / BCB-561)", () => {
  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    for (const ns of MARKETING_NAMESPACES) {
      const entries = flatten(
        (catalog as Record<string, unknown>)[ns],
        ns
      ) satisfies Array<[string, string]>;

      it(`${locale}/${ns} states no currency total and no remittance framing`, () => {
        const hits = entries.flatMap(([path, value]) =>
          FORBIDDEN.filter(([, re]) => re.test(value)).map(
            ([label]) => `${path}: ${label} — "${value}"`
          )
        );
        expect(hits).toEqual([]);
      });
    }

    it(`${locale} attributes and dates the stablecoin-share stat`, () => {
      const landing = (catalog as typeof en).landing;
      // The share is the claim; it must carry a source with a year (D7 dating rule).
      expect(landing.payStatValue).toMatch(/90\s*%/);
      expect(landing.payStatSource).toMatch(/\b(19|20)\d{2}\b/);
      expect(landing.payStatSource.length).toBeGreaterThan(20);
    });

    // #875 — the catalog spec's audience scope: every course gates on working
    // JavaScript, segment 3 is out of scope for this wave, and copy must not
    // imply beginners-welcome. The prerequisite and the refer-out are required
    // in every locale, and no-experience-needed claims are forbidden.
    it(`${locale} states the JS prerequisite and refers segment 3 out`, () => {
      const c = (catalog as typeof en).courses;
      const s = (catalog as typeof en).start;
      expect(c.prereqTitle.length).toBeGreaterThan(0);
      expect(c.prereqBody).toMatch(/javascript/i);
      expect(c.prereqNewToCode).toMatch(/freecodecamp/i);
      expect(c.prereqFccLink).toMatch(/freecodecamp/i);
      expect(s.referral.body).toMatch(/(javascript)/i);
      expect(s.referral.link).toMatch(/freecodecamp/i);
    });

    it(`${locale} never claims no experience is needed`, () => {
      const entries = [
        ...flatten((catalog as Record<string, unknown>).courses, "courses"),
        ...flatten((catalog as Record<string, unknown>).landing, "landing"),
        ...flatten((catalog as Record<string, unknown>).start, "start"),
      ];
      const claims: RegExp[] = [
        /\bno (?:prior |previous )?experience (?:needed|required)\b/i,
        /\bno prerequisites?\b/i,
        /\bsem (?:qualquer )?experi[êe]ncia\b/i,
        /\bsem pr[ée]-?requisitos?\b/i,
        /\bsin (?:ninguna )?experiencia\b/i,
        /\bsin requisitos\b/i,
      ];
      const hits = entries.flatMap(([path, value]) =>
        claims.filter((re) => re.test(value)).map(() => `${path}: "${value}"`)
      );
      expect(hits).toEqual([]);
    });
  }
});
