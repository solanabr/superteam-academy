import { join } from "node:path";
import type { Page } from "@playwright/test";

const MONACO_MIN = join(__dirname, "../../node_modules/monaco-editor/min");

/**
 * Monaco's loader fetches from jsdelivr. Serve the same files from node_modules
 * so a CDN outage can't fail a spec, and it can't skip either: a spec can wait
 * for the mounted `.monaco-editor`, not the loading skeleton.
 */
export function serveMonacoLocally(page: Page) {
  return page.route(
    /^https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@[^/]+\/min\//,
    (route) => {
      const path = new URL(route.request().url()).pathname.replace(
        /^\/npm\/monaco-editor@[^/]+\/min\//,
        ""
      );
      return route.fulfill({
        path: join(MONACO_MIN, path),
        headers: { "access-control-allow-origin": "*" },
      });
    }
  );
}
