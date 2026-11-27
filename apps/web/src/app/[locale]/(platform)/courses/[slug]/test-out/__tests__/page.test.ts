import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const routeDir = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("/courses/[slug]/test-out while switched off", () => {
  // A `notFound()` inside the page would stream under the platform loading.tsx
  // and answer HTTP 200. With no route file the URL is a real 404.
  it("has no route file", () => {
    expect(existsSync(join(routeDir, "page.tsx"))).toBe(false);
    expect(existsSync(join(routeDir, "route.ts"))).toBe(false);
  });

  it("keeps the page code so the feature can return", () => {
    expect(existsSync(join(routeDir, "test-out-page.tsx"))).toBe(true);
  });
});
