import { describe, it, expect, vi } from "vitest";
import { buildModel } from "../checks/gate1-schema";
import {
  gate21Check,
  compareSemver,
  type FetchLatest,
  type FetchResult,
} from "../checks/gate21-version-currency";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate21-version-currency";
import { makeTempRepo } from "./helpers";

/** Build the typed RepoModel from a `path -> contents` tree (gate 1's job). */
function modelFrom(tree: Record<string, string>) {
  return buildModel(makeTempRepo(tree), []);
}

/** A lesson with an optional version stamp, as authored YAML. */
function lesson(
  name: string,
  packages: Record<string, string>,
  checkedAt = "2026-07-25"
): Record<string, string> {
  const pkgLines = Object.entries(packages)
    .map(([n, v]) => `    "${n}": "${v}"`)
    .join("\n");
  return {
    [`courses/x/lessons/${name}/lesson.yaml`]: `id: lesson-${name}
slug: ${name}
title: ${name}
skills: [pdas]
blocks:
  - { key: intro, type: prose, src: intro.md }
versionStamp:
  checkedAt: "${checkedAt}"
  packages:
${pkgLines}
`,
  };
}

/** A lesson with NO version stamp. */
function plainLesson(name: string): Record<string, string> {
  return {
    [`courses/x/lessons/${name}/lesson.yaml`]: `id: lesson-${name}
slug: ${name}
title: ${name}
skills: [pdas]
blocks:
  - { key: intro, type: prose, src: intro.md }
`,
  };
}

/** A mock registry: names → `latest`, with optional not-found / unreachable sets. */
function registry(
  latest: Record<string, string>,
  opts: { notFound?: string[]; unreachable?: string[] } = {}
): FetchLatest {
  return async (pkg): Promise<FetchResult> => {
    if (opts.unreachable?.includes(pkg)) {
      return { ok: false, reason: "unreachable" };
    }
    if (opts.notFound?.includes(pkg)) return { ok: false, reason: "not-found" };
    if (pkg in latest) return { ok: true, latest: latest[pkg]! };
    return { ok: false, reason: "not-found" };
  };
}

const of = (ds: Awaited<ReturnType<typeof gate21Check>>, gate: string) =>
  ds.filter((d) => d.gate === gate);

describe("compareSemver", () => {
  it("orders release versions numerically per field", () => {
    expect(compareSemver("6.10.0", "7.0.0")).toBe(-1);
    expect(compareSemver("7.0.0", "6.10.0")).toBe(1);
    expect(compareSemver("6.10.0", "6.9.0")).toBe(1); // 10 > 9, not string order
    expect(compareSemver("1.98.4", "1.98.4")).toBe(0);
  });

  it("ranks a prerelease below its release", () => {
    expect(compareSemver("8.0.0-canary.1", "8.0.0")).toBe(-1);
    expect(compareSemver("8.0.0", "8.0.0-canary.1")).toBe(1);
  });

  it("orders prerelease identifiers per semver (numeric < alphanumeric, longer wins)", () => {
    expect(compareSemver("8.0.0-canary.1", "8.0.0-canary.2")).toBe(-1);
    expect(compareSemver("1.0.0-alpha", "1.0.0-alpha.1")).toBe(-1);
    expect(compareSemver("1.0.0-alpha.1", "1.0.0-beta")).toBe(-1);
  });

  it("ignores build metadata", () => {
    expect(compareSemver("7.0.0+build.9", "7.0.0")).toBe(0);
  });
});

describe("gate 21a — version-stamp drift", () => {
  it("warns (not errors) when a pinned version is behind latest, naming the packages and the lesson", async () => {
    const model = modelFrom({
      ...lesson("a", {
        "@solana/kit": "6.10.0",
        "@solana-program/token": "0.14.0",
      }),
    });
    const ds = await gate21Check(model, {
      fetchLatest: registry({
        "@solana/kit": "7.0.0",
        "@solana-program/token": "0.15.0",
      }),
    });
    const g = of(ds, "gate-21a");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("warning");
    expect(g[0]?.file).toBe("courses/x/lessons/a/lesson.yaml");
    expect(g[0]?.message).toContain(
      "@solana/kit pinned 6.10.0, registry latest 7.0.0"
    );
    expect(g[0]?.message).toContain(
      "@solana-program/token pinned 0.14.0, registry latest 0.15.0"
    );
    expect(g[0]?.message).toContain("2026-07-25");
    // Currency signal — a drifted pin never fails the lint.
    expect(ds.some((d) => d.severity === "error")).toBe(false);
  });

  it("is silent when every pin equals latest", async () => {
    const model = modelFrom({ ...lesson("a", { "@solana/kit": "7.0.0" }) });
    const ds = await gate21Check(model, {
      fetchLatest: registry({ "@solana/kit": "7.0.0" }),
    });
    expect(of(ds, "gate-21a")).toEqual([]);
  });

  it("reports only the behind packages when a stamp is partially current", async () => {
    const model = modelFrom({
      ...lesson("a", { "@solana/kit": "6.10.0", "@solana/web3.js": "1.98.4" }),
    });
    const ds = await gate21Check(model, {
      fetchLatest: registry({
        "@solana/kit": "7.0.0",
        "@solana/web3.js": "1.98.4",
      }),
    });
    const g = of(ds, "gate-21a");
    expect(g).toHaveLength(1);
    expect(g[0]?.message).toContain("@solana/kit");
    expect(g[0]?.message).not.toContain("@solana/web3.js");
  });

  it("emits a notice (not a warning) when a pin is AHEAD of latest — an intentional prerelease pin", async () => {
    const model = modelFrom({
      ...lesson("a", { "@solana/kit": "8.0.0-canary.5" }),
    });
    const ds = await gate21Check(model, {
      fetchLatest: registry({ "@solana/kit": "7.0.0" }),
    });
    const g = of(ds, "gate-21a");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("notice");
    expect(g[0]?.message).toContain("ahead of registry latest 7.0.0");
  });

  it("warns when a pinned package is not on the registry (typo / unpublished)", async () => {
    const model = modelFrom({
      // `@solana/kit-typo` is a deliberate bad name — the registry 404s it.
      ...lesson("a", { "@solana/kit": "7.0.0", "@solana/kit-typo": "1.0.0" }),
    });
    const ds = await gate21Check(model, {
      fetchLatest: registry(
        { "@solana/kit": "7.0.0" },
        { notFound: ["@solana/kit-typo"] }
      ),
    });
    const g = of(ds, "gate-21a");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("warning");
    expect(g[0]?.message).toContain("not on the npm registry");
    expect(g[0]?.message).toContain("@solana/kit-typo");
    expect(ds.some((d) => d.severity === "error")).toBe(false);
  });
});

describe("gate 21b — registry unreachable", () => {
  it("emits ONE aggregated notice (never an error) when the registry is down, and no drift warnings", async () => {
    const model = modelFrom({
      ...lesson("a", {
        "@solana/kit": "6.10.0",
        "@solana-program/token": "0.14.0",
      }),
      ...lesson("b", { "@solana/kit": "6.10.0" }),
    });
    const ds = await gate21Check(model, {
      fetchLatest: registry(
        {},
        { unreachable: ["@solana/kit", "@solana-program/token"] }
      ),
    });
    const notices = of(ds, "gate-21b");
    expect(notices).toHaveLength(1);
    expect(notices[0]?.severity).toBe("notice");
    expect(notices[0]?.message).toContain("unreachable");
    expect(notices[0]?.message).toContain("@solana/kit");
    // Unreachable packages produce no drift warning and no error.
    expect(of(ds, "gate-21a")).toEqual([]);
    expect(ds.some((d) => d.severity === "error")).toBe(false);
  });

  it("still checks the reachable packages when only some are unreachable", async () => {
    const model = modelFrom({
      ...lesson("a", {
        "@solana/kit": "6.10.0",
        "@solana-program/token": "0.14.0",
      }),
    });
    const ds = await gate21Check(model, {
      fetchLatest: registry(
        { "@solana/kit": "7.0.0" },
        { unreachable: ["@solana-program/token"] }
      ),
    });
    expect(of(ds, "gate-21b")).toHaveLength(1);
    const g = of(ds, "gate-21a");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("warning");
    expect(g[0]?.message).toContain(
      "@solana/kit pinned 6.10.0, registry latest 7.0.0"
    );
    expect(g[0]?.message).not.toContain("@solana-program/token");
  });
});

describe("gate 21 — opt-in field and network discipline", () => {
  it("makes no diagnostics and no network call when no lesson has a stamp", async () => {
    const model = modelFrom({ ...plainLesson("a"), ...plainLesson("b") });
    const fetchLatest = vi.fn<FetchLatest>();
    const ds = await gate21Check(model, { fetchLatest });
    expect(ds).toEqual([]);
    expect(fetchLatest).not.toHaveBeenCalled();
  });

  it("queries each distinct package exactly once across many lessons", async () => {
    const model = modelFrom({
      ...lesson("a", { "@solana/kit": "6.10.0" }),
      ...lesson("b", { "@solana/kit": "6.10.0" }),
      ...lesson("c", { "@solana/kit": "6.10.0" }),
    });
    const fetchLatest = vi.fn<FetchLatest>(async () => ({
      ok: true,
      latest: "7.0.0",
    }));
    await gate21Check(model, { fetchLatest });
    expect(fetchLatest).toHaveBeenCalledTimes(1);
    expect(fetchLatest).toHaveBeenCalledWith("@solana/kit");
  });

  it("is wired into runLint and stays offline for a stamp-free repo", async () => {
    // No fetch is mockable through runLint; a stamp-free repo must therefore
    // reach the early return and never touch the network.
    const r = await runLint(makeTempRepo({ ...plainLesson("a") }));
    expect(r.diagnostics.filter((d) => d.gate.startsWith("gate-21"))).toEqual(
      []
    );
    expect(r.ok).toBe(true);
  });
});
