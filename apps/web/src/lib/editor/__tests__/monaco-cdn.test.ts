import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { buildCsp } from "@/lib/csp";
import {
  MONACO_CDN_SOURCE,
  MONACO_VERSION,
  MONACO_VS_PATH,
} from "@/lib/editor/monaco-cdn";

const h = vi.hoisted(() => ({ config: vi.fn() }));

vi.mock("@monaco-editor/react", () => ({ loader: { config: h.config } }));

const SRC_ROOT = join(__dirname, "../../..");

function sourceFiles(): string[] {
  return readdirSync(SRC_ROOT, { recursive: true, encoding: "utf8" }).filter(
    (file) => /\.tsx?$/.test(file) && !file.includes("__tests__")
  );
}

describe("Monaco CDN pin", () => {
  it("matches the installed monaco-editor, which supplies the types and the e2e copy", () => {
    const installed = JSON.parse(
      readFileSync(
        join(__dirname, "../../../../node_modules/monaco-editor/package.json"),
        "utf8"
      )
    ) as { version: string };
    expect(MONACO_VERSION).toBe(installed.version);
  });

  it("is an exact version, so the CDN path can't move under the policy", () => {
    expect(MONACO_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("points the loader at the pinned path", async () => {
    await import("@/components/editor/monaco-loader");
    expect(h.config).toHaveBeenCalledWith({ paths: { vs: MONACO_VS_PATH } });
  });

  it("serves the loader from inside the path the CSP allows", () => {
    expect(`${MONACO_VS_PATH}/loader.js`.startsWith(MONACO_CDN_SOURCE)).toBe(
      true
    );
    expect(buildCsp("n")).toContain(MONACO_CDN_SOURCE);
  });

  it("uses a trailing slash, which is what makes a CSP path a prefix match", () => {
    expect(MONACO_CDN_SOURCE.endsWith("/")).toBe(true);
  });

  it("configures the loader in every module that mounts an editor", () => {
    const mounting = sourceFiles().filter((file) =>
      /^import (?!type\b).*from "@monaco-editor\/react"/m.test(
        readFileSync(join(SRC_ROOT, file), "utf8")
      )
    );
    const editors = mounting.filter(
      (file) => !file.endsWith("monaco-loader.ts")
    );

    expect(editors.length).toBeGreaterThan(0);
    for (const file of editors) {
      expect(readFileSync(join(SRC_ROOT, file), "utf8")).toContain(
        'import "./monaco-loader"'
      );
    }
  });
});
