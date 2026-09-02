// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { DeployedAchievement } from "@/lib/content/queries";
import { AchievementRing } from "../achievement-ring";

/**
 * The ring is a fixed-radius circle, so the number of items IS the spacing:
 * every extra badge divides the same circumference further. At the full
 * catalog the arc per item fell below the width of one label and the badges
 * ran into each other, so the ring shows a fixed-size random sample instead.
 */
const catalog: DeployedAchievement[] = Array.from({ length: 18 }, (_, i) => ({
  id: `achievement-${i}`,
  name: `Achievement ${i}`,
  description: `Description ${i}`,
  glyph: "01",
  category: "progress",
  xpReward: 10,
  solTier: false,
})) as unknown as DeployedAchievement[];

const namesOf = (c: HTMLElement) =>
  [...c.querySelectorAll(".ach-ring-item")].map(
    (el) => el.querySelector(".ach-ring-name")?.textContent ?? ""
  );

describe("AchievementRing — a fixed, spaced sample of the catalog", () => {
  it("shows fewer items than the catalog, so neighbours keep a gap", () => {
    const { container } = render(<AchievementRing achievements={catalog} />);
    const items = container.querySelectorAll(".ach-ring-item");
    expect(items.length).toBeLessThan(catalog.length);
    expect(items.length).toBe(9);
  });

  it("spreads the items evenly around the full turn", () => {
    const { container } = render(<AchievementRing achievements={catalog} />);
    const items = [
      ...container.querySelectorAll<HTMLElement>(".ach-ring-item"),
    ];
    const step = 360 / items.length;
    items.forEach((el, i) => {
      expect(el.style.getPropertyValue("--ring-a")).toBe(`${i * step}deg`);
    });
  });

  it("draws distinct achievements, all from the catalog", () => {
    const { container } = render(<AchievementRing achievements={catalog} />);
    const names = namesOf(container);
    expect(new Set(names).size).toBe(names.length);
    names.forEach((n) => expect(catalog.some((a) => a.name === n)).toBe(true));
  });

  it("renders deterministically on the server, so hydration matches", () => {
    // The draw lands in an effect, never in a render: a server pass that
    // shuffled would disagree with the client's first pass and blow up
    // hydration. The server therefore emits the leading slice, in order.
    const html = renderToString(<AchievementRing achievements={catalog} />);
    catalog.slice(0, 9).forEach((a) => expect(html).toContain(a.name));
    expect(html).not.toContain(">Achievement 9<");
    expect(renderToString(<AchievementRing achievements={catalog} />)).toBe(
      html
    );
  });

  it("shows every achievement when the catalog is smaller than the ring", () => {
    const few = catalog.slice(0, 3);
    const { container } = render(<AchievementRing achievements={few} />);
    expect(container.querySelectorAll(".ach-ring-item").length).toBe(3);
  });
});
