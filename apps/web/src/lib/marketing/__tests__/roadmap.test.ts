// #876: the roadmap's whole point is that it is dated and honest. These tests
// hold both properties: shipped entries carry a real, past ISO date; planned
// entries carry no date at all (a public date goes up only after owner
// sign-off); and every entry has copy in all three locales.
import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";
import { ROADMAP_NEXT, ROADMAP_SHIPPED, formatRoadmapDate } from "../roadmap";

const CATALOGS = { en, es, "pt-BR": ptBR } as const;

describe("public roadmap", () => {
  it("dates every shipped entry with a real, non-future ISO date", () => {
    expect(ROADMAP_SHIPPED.length).toBeGreaterThan(0);
    for (const entry of ROADMAP_SHIPPED) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const t = Date.parse(`${entry.date}T00:00:00Z`);
      expect(Number.isNaN(t)).toBe(false);
      expect(t).toBeLessThanOrEqual(Date.now());
    }
  });

  it("orders shipped entries newest first", () => {
    const dates = ROADMAP_SHIPPED.map((e) => e.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("publishes no date for planned entries", () => {
    for (const entry of ROADMAP_NEXT) {
      expect(entry).not.toHaveProperty("date");
    }
  });

  it("uses distinct ids across both lists", () => {
    const ids = [...ROADMAP_SHIPPED, ...ROADMAP_NEXT].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("formats dates per locale in UTC", () => {
    expect(formatRoadmapDate("2026-07-30", "en")).toMatch(/2026/);
    // Same instant, different locale renderings — and never an off-by-one day.
    for (const locale of ["en", "es", "pt-BR"]) {
      expect(formatRoadmapDate("2026-07-30", locale)).toMatch(/\b30\b/);
    }
  });

  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    it(`${locale} has title + body copy for every entry`, () => {
      const items = (catalog as typeof en).roadmap.items as Record<
        string,
        { title: string; body: string } | undefined
      >;
      for (const entry of [...ROADMAP_SHIPPED, ...ROADMAP_NEXT]) {
        const copy = items[entry.id];
        expect(
          copy,
          `${locale}: missing roadmap.items.${entry.id}`
        ).toBeDefined();
        expect(copy?.title.length).toBeGreaterThan(0);
        expect(copy?.body.length).toBeGreaterThan(0);
      }
    });
  }
});
