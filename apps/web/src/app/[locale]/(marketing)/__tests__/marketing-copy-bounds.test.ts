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

// #906 — the "no experience needed" guard. Every course gates on working
// JavaScript (#875), so unqualified beginners-welcome copy is a false promise
// until the JS/TS rung (#579) exists. A claim is forbidden when a negation
// lands on an experience noun *without* a topic scope: "no experience needed"
// is a lie, "no Rust experience required" is the actual prerequisite copy.
//
// Scope may sit before the noun (EN: "no *Rust* experience") or after it via a
// preposition (PT/ES: "experiência *com* blockchain"), so both windows are
// checked. Anything unscoped fails, whatever qualifier is in between.
const SCOPED_TOPIC =
  /\b(?:blockchain|solana|rust|crypto\w*|cripto\w*|web3|defi|nfts?|anchor|smart[\s-]?contracts?|contratos?|on-?chain|onchain|token\w*)/i;

interface ClaimRule {
  label: string;
  /** Negation + gap (group 1) + experience noun. */
  re: RegExp;
  /** If set, a topic scope may also attach after the noun via these prepositions. */
  scopeAfter?: RegExp;
}

const CLAIM_RULES: ClaimRule[] = [
  {
    label: "unqualified no-experience claim (en)",
    re: /\b(?:no|zero|without(?:\s+any)?)\s+([\w\s,'’/-]{0,40}?)(?:experience|background|knowledge)\b/gi,
    scopeAfter: /with|in|of|about/,
  },
  {
    label: "no-code claim (en)",
    re: /\b(?:no|zero)\s+(?:coding|code|programming|dev(?:eloper)?\s+skills?|technical\s+skills?)\b()/gi,
  },
  {
    label: "no-prerequisites claim (en)",
    re: /\b(?:no|zero)\s+(?:prior\s+)?(?:prerequisites?|pre-?reqs?|requirements?)\b()/gi,
  },
  {
    label: "unqualified no-experience claim (pt)",
    re: /\b(?:sem|nenhum(?:a)?|zero|n[ãa]o\s+(?:é\s+)?precisa?(?:r|o)?(?:\s+(?:de|ter))?|n[ãa]o\s+exige)\s+([\w\s,'’/-]{0,40}?)(?:experi[êe]ncias?|conhecimentos?|bagagem)\b/gi,
    scopeAfter: /com|em|de|sobre/,
  },
  {
    label: "no-code claim (pt)",
    re: /\b(?:sem\s+(?:nunca\s+)?saber\s+program\w*|n[ãa]o\s+precisa\s+(?:saber\s+)?programar|sem\s+(?:nenhum\s+|escrever\s+)?c[oó]digo|do\s+zero\s+sem)\b()/gi,
  },
  {
    label: "no-prerequisites claim (pt)",
    re: /\b(?:sem|nenhum)\s+(?:nenhum\s+)?pr[ée]-?requisitos?\b()/gi,
  },
  {
    label: "unqualified no-experience claim (es)",
    re: /\b(?:sin|ninguna|cero|no\s+(?:hace\s+falta|necesitas|se\s+necesita|requiere|hay\s+que\s+tener)(?:\s+tener)?)\s+([\w\s,'’/-]{0,40}?)(?:experiencias?|conocimientos?)\b/gi,
    scopeAfter: /con|en|de|sobre/,
  },
  {
    label: "no-code claim (es)",
    re: /\b(?:sin\s+saber\s+programa\w*|no\s+necesitas\s+programar|sin\s+(?:escribir\s+)?c[oó]digo|desde\s+cero\s+sin)\b()/gi,
  },
  {
    label: "no-prerequisites claim (es)",
    re: /\b(?:sin|ning[úu]n)\s+(?:ning[úu]n\s+)?requisitos?\b()/gi,
  },
];

/** Topic scope attached right after the noun, e.g. "experiência com blockchain". */
function hasTrailingScope(
  text: string,
  from: number,
  prepositions: RegExp
): boolean {
  const tail = new RegExp(
    `^\\s*(?:${prepositions.source})\\b[^.!?;—]{0,40}`,
    "i"
  ).exec(text.slice(from, from + 80));
  return tail !== null && SCOPED_TOPIC.test(tail[0]);
}

/** Returns the label of every forbidden no-experience claim in `value`. */
export function findNoExperienceClaims(value: string): string[] {
  const hits: string[] = [];
  for (const { label, re, scopeAfter } of CLAIM_RULES) {
    for (const m of value.matchAll(re)) {
      const scoped =
        SCOPED_TOPIC.test(m[1] ?? "") ||
        (scopeAfter !== undefined &&
          hasTrailingScope(value, m.index + m[0].length, scopeAfter));
      if (!scoped) hits.push(label);
    }
  }
  return hits;
}

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
      const hits = entries.flatMap(([path, value]) =>
        findNoExperienceClaims(value).map(
          (label) => `${path}: ${label} — "${value}"`
        )
      );
      expect(hits).toEqual([]);
    });
  }
});

// #906 — the guard itself. The old pattern only allowed "prior "/"previous "
// between "no" and "experience", so "no coding experience required" shipped.
describe("no-experience claim detector (#906)", () => {
  const FORBIDDEN_COPY = [
    "No experience needed.",
    "No experience required — start today.",
    "Zero experience? Start here.",
    "No prior experience necessary.",
    "No previous experience required.",
    "No coding experience required.",
    "No programming experience needed.",
    "No prior coding experience required.",
    "No technical background required.",
    "No prior knowledge needed.",
    "Without any experience, you can ship.",
    "Beginner-friendly — no code.",
    "No coding required.",
    "No prerequisites.",
    "No prior prerequisites at all.",
    "Zero requirements to join.",
    "Sem experiência.",
    "Nenhuma experiência necessária.",
    "Sem qualquer experiência prévia.",
    "Não precisa de experiência.",
    "Não é preciso ter experiência.",
    "Sem nenhum conhecimento prévio.",
    "Sem saber programar.",
    "Não precisa saber programar.",
    "Comece do zero sem escrever uma linha.",
    "Sem pré-requisitos.",
    "Sin experiencia.",
    "Sin ninguna experiencia previa.",
    "No hace falta experiencia.",
    "No necesitas conocimientos previos.",
    "Cero experiencia, cero problema.",
    "Sin saber programar.",
    "Empieza desde cero sin escribir código.",
    "Sin requisitos.",
  ];

  // Topic-scoped disclaimers and neutral copy: these are the real strings the
  // catalogs ship (or close variants) and must never trip the guard.
  const ALLOWED_COPY = [
    "That is the only gate — no blockchain, cryptography or Rust experience required.",
    "No Solana experience needed, but you should already know TypeScript.",
    "No prior blockchain knowledge is assumed.",
    "No experience with Solana required — but you should know TypeScript.",
    "Bring your JavaScript experience; we handle the chain.",
    "Learning to program from scratch? freeCodeCamp is the best place to start.",
    "We do not teach programming from scratch yet.",
    "Beginner",
    "Real code in your browser.",
    "Esse é o único requisito — não é preciso ter experiência com blockchain, criptografia ou Rust.",
    "Está aprendendo a programar do zero? O freeCodeCamp é o melhor lugar para começar.",
    "Comece do zero, uma lição de cada vez.",
    "Ainda não ensinamos programação do zero — o freeCodeCamp ensina, e ensina bem.",
    "Ese es el único requisito — no hace falta experiencia con blockchain, criptografía ni Rust.",
    "¿Estás aprendiendo a programar desde cero? freeCodeCamp es el mejor lugar para empezar.",
    "Empieza desde cero, una lección a la vez.",
    "Entra en cualquier curso — el orden es una recomendación, no un requisito.",
  ];

  it.each(FORBIDDEN_COPY)("flags %j", (copy) => {
    expect(findNoExperienceClaims(copy)).not.toEqual([]);
  });

  it.each(ALLOWED_COPY)("allows %j", (copy) => {
    expect(findNoExperienceClaims(copy)).toEqual([]);
  });
});
