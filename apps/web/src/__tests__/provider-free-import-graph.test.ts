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
 * skipped) from the four entry points a marketing page mounts, and fails if
 * any forbidden package is reachable.
 */

const SRC = path.resolve(__dirname, "..");

const ENTRY_POINTS = [
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

/** `import … from "x"` / `export … from "x"`, minus `import type`. */
const IMPORT_RE =
  /(?:^|\n)\s*(?:import|export)(?!\s+type\s)(?:[\s\S]*?from\s*)?["']([^"']+)["']/g;

function readImports(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const found: string[] = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    const specifier = match[1];
    if (specifier) found.push(specifier);
  }
  return found;
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
