import { readFileSync, existsSync, statSync } from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

/**
 * #1097's actual deliverable, as a test: marketing first loads must not carry
 * wallet-adapter, the Dynamic SDK, or TanStack Query. Those live behind
 * `React.lazy` boundaries — `scoped-auth-providers` and `auth-modal-body` —
 * and one careless static import from anything the Header renders undoes the
 * whole demotion silently, since the app still works, just 300 kB heavier.
 *
 * Walks the STATIC import graph (dynamic `import()` is the boundary, so it is
 * deliberately not followed; `import type` is erased at build and likewise
 * skipped) from the entry points a marketing page mounts, and fails if any
 * forbidden package is reachable.
 */

const SRC = path.resolve(__dirname, "..");

const ENTRY_POINTS = [
  // The layouts come first because they are where the stack LIVED before
  // #1097, and they render the Header on every marketing route — a guard that
  // starts at the Header alone never sees a provider re-added above it.
  "app/[locale]/layout.tsx",
  "app/[locale]/(marketing)/layout.tsx",
  "components/layout/header.tsx",
  "components/auth/auth-modal.tsx",
  "components/auth/user-menu.tsx",
  "app/[locale]/(marketing)/landing-client.tsx",
];

const FORBIDDEN = [
  "@solana/wallet-adapter-base",
  "@solana/wallet-adapter-react",
  "@solana/wallet-adapter-react-ui",
  "@solana/wallet-adapter-wallets",
  "@dynamic-labs-sdk/client",
  "@dynamic-labs-sdk/react-hooks",
  "@dynamic-labs-sdk/solana",
  "@tanstack/react-query",
];

/**
 * `import … from "x"`, `export … from "x"`, and BARE `import "x"` — minus
 * `import type`/`export type`, which are erased at build.
 *
 * The bare form matters twice over: a side-effect import of a forbidden
 * package is invisible without it, and so is a side-effect import of a LOCAL
 * module, which takes that module's whole subtree out of the walk with it.
 *
 * The clause between the keyword and `from` is restricted to what can
 * actually appear there (identifiers, braces, commas, `*`, whitespace) so a
 * match can never run past the end of a statement and swallow the next one.
 */
const IMPORT_RE =
  /(?:^|\n)\s*(?:import|export)\b(?!\s+type\b)(?:[\w\s,{}*$]*?\bfrom\s*)?\s*["']([^"']+)["']/g;

/** Exported for its own tests — the walker is only as good as this. */
export function parseImports(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    const specifier = match[1];
    if (specifier) found.push(specifier);
  }
  return found;
}

function readImports(file: string): string[] {
  return parseImports(readFileSync(file, "utf8"));
}

function resolveLocal(specifier: string, fromFile: string): string | null {
  const base = specifier.startsWith("@/")
    ? path.join(SRC, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(fromFile), specifier)
      : null;
  if (base === null) return null; // a package, not a local module

  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null; // css, json, or something with no module body to walk
}

/** Every package name statically reachable from `entry`, with one path each. */
function reachablePackages(entry: string): Map<string, string[]> {
  const packages = new Map<string, string[]>();
  const seen = new Set<string>();
  const queue: { file: string; trail: string[] }[] = [
    { file: path.join(SRC, entry), trail: [entry] },
  ];

  while (queue.length > 0) {
    const { file, trail } = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);

    for (const specifier of readImports(file)) {
      const local = resolveLocal(specifier, file);
      if (local) {
        queue.push({
          file: local,
          trail: [...trail, path.relative(SRC, local)],
        });
      } else if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
        if (!packages.has(specifier)) packages.set(specifier, trail);
      }
    }
  }
  return packages;
}

describe("marketing entry points stay free of the wallet/Dynamic stack (#1097)", () => {
  it.each(ENTRY_POINTS)("%s", (entry) => {
    expect(existsSync(path.join(SRC, entry))).toBe(true);
    const packages = reachablePackages(entry);

    const offenders = FORBIDDEN.filter((pkg) =>
      [...packages.keys()].some(
        (found) => found === pkg || found.startsWith(`${pkg}/`)
      )
    ).map((pkg) => {
      const via = [...packages.entries()].find(
        ([found]) => found === pkg || found.startsWith(`${pkg}/`)
      );
      return `${pkg} via ${via?.[1].join(" -> ")}`;
    });

    expect(offenders).toEqual([]);
  });

  it("covers the layouts that render the Header, not just the Header", () => {
    // The stack lived in these two files before #1097, so a regression lands
    // here first. Asserting membership keeps a future trim from quietly
    // reopening that door.
    expect(ENTRY_POINTS).toContain("app/[locale]/layout.tsx");
    expect(ENTRY_POINTS).toContain("app/[locale]/(marketing)/layout.tsx");
  });

  it("still finds the forbidden packages where they legitimately live", () => {
    // Guards the walker itself: if the regex or the resolver silently stopped
    // matching, every assertion above would pass vacuously.
    const packages = reachablePackages(
      "components/auth/scoped-auth-providers.tsx"
    );
    const names = [...packages.keys()];
    expect(names).toContain("@solana/wallet-adapter-react");
    expect(names.some((n) => n.startsWith("@dynamic-labs-sdk/"))).toBe(true);
  });
});

describe("the import scanner itself", () => {
  it("sees bare side-effect imports — of a package and of a local module", () => {
    // Both were invisible before: the regex required a `from`. A package
    // imported this way went unreported, and a LOCAL module imported this way
    // was never enqueued, hiding its entire subtree.
    expect(parseImports('import "@solana/wallet-adapter-react";')).toEqual([
      "@solana/wallet-adapter-react",
    ]);
    expect(
      parseImports('import "@/components/auth/scoped-auth-providers";')
    ).toEqual(["@/components/auth/scoped-auth-providers"]);
    expect(parseImports('import "./styles.css";')).toEqual(["./styles.css"]);
  });

  it("still reads the ordinary forms", () => {
    expect(
      parseImports(
        [
          'import Default from "a";',
          'import { named, other as alias } from "b";',
          'import * as ns from "c";',
          'import Mixed, { thing } from "d";',
          "import {\n  multi,\n  line,\n} from 'e';",
        ].join("\n")
      )
    ).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("follows barrel re-exports and skips type-only ones", () => {
    expect(
      parseImports(
        [
          'export * from "barrel";',
          'export { thing } from "named-barrel";',
          'export type { Only } from "types-only";',
          'export type * from "types-star";',
        ].join("\n")
      )
    ).toEqual(["barrel", "named-barrel"]);
  });

  it("skips `import type`, which is erased at build", () => {
    expect(
      parseImports(
        [
          'import type { Props } from "erased";',
          'import type Default from "also-erased";',
          'import typeahead from "not-a-type-import";',
        ].join("\n")
      )
    ).toEqual(["not-a-type-import"]);
  });

  it("does not follow dynamic import(), which is the chunk boundary", () => {
    expect(
      parseImports(
        [
          'const m = await import("dynamic");',
          "lazy(() => import('also-dynamic'));",
          'import("at-line-start");',
        ].join("\n")
      )
    ).toEqual([]);
  });

  it("never lets one statement swallow the next", () => {
    // The clause charset stops at `;` and `(`, so a bare import followed by a
    // real one cannot be matched as a single span that loses the first.
    expect(
      parseImports(
        ['import "side-effect";', 'import x from "real";'].join("\n")
      )
    ).toEqual(["side-effect", "real"]);
  });
});
