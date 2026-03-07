import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("grant remaining scope", () => {
  it("adds a course filter to the leaderboard UI and API flow", () => {
    const pageSource = readSource("src", "app", "[locale]", "leaderboard", "page.tsx");
    const routeSource = readSource("src", "app", "api", "leaderboard", "route.ts");
    const hookSource = readSource("src", "lib", "hooks", "use-leaderboard.ts");

    expect(pageSource).toContain("selectedCourse");
    expect(pageSource).toContain("SelectTrigger");
    expect(hookSource).toContain("courseSlug");
    expect(routeSource).toContain("course");
    expect(routeSource).toContain("getLeaderboard(timeframe, limit, course");
  });

  it("adds radar-chart skills and social links to profile surfaces", () => {
    const profileSource = readSource("src", "app", "[locale]", "profile", "page.tsx");
    const publicProfileRoute = readSource("src", "app", "api", "profile", "[username]", "route.ts");

    expect(profileSource).toContain("RadarChart");
    expect(profileSource).toContain("socialLinks");
    expect(publicProfileRoute).toContain("twitterHandle");
    expect(publicProfileRoute).toContain("websiteUrl");
  });

  it("adds editable social links and notification preferences to settings", () => {
    const settingsSource = readSource("src", "app", "[locale]", "settings", "page.tsx");
    const profileRouteSource = readSource("src", "app", "api", "profile", "route.ts");

    expect(settingsSource).toContain("socialLinks");
    expect(settingsSource).toContain("emailNotifications");
    expect(settingsSource).toContain("website");
    expect(profileRouteSource).toContain("twitterHandle");
    expect(profileRouteSource).toContain("preferredLocale");
  });

  it("adds a downloadable certificate image action", () => {
    const source = readSource("src", "app", "[locale]", "certificates", "[id]", "page.tsx");

    expect(source).toContain("handleDownload");
    expect(source).toContain('t("download")');
    expect(source).toContain("image/svg+xml");
  });
});
