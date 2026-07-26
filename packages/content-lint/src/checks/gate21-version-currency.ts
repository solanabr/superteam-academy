import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

/**
 * Gate 21 — version-stamp currency check (unified launch spec 2026-07-25 §3
 * item 8). Numbered after gate 20 (originality, #604). For every lesson that carries a
 * `versionStamp` (schema: content-schema `version-stamp.ts`, an OPT-IN field —
 * see below), query the npm registry for each pinned package's `latest`
 * dist-tag and surface drift.
 *
 * This is the catch mechanism for the failure mode that rotted every
 * competitor's material (CAT-13: @solana/kit 8.0.0-canary publishes daily;
 * @solana/react pins kit exactly so a Kit-8 bump moves in lockstep;
 * @solana-program/token is already minors past the spec's pin; C5 deliberately
 * pins the kit-6 shelf while C1–C4 pin 7). "Load-bearing, not hygiene."
 *
 * Tiering (mirrors gate 19b's reasoning — a currency signal must never redden
 * content CI, since a hard error would break every content PR the moment an
 * upstream release ships):
 *
 *  21a (warning) a pinned version is BEHIND the registry `latest`, or the
 *                package is not on the registry (typo / unpublished). Actionable:
 *                re-verify the lesson against the current stack and bump
 *                `checkedAt`, or correct the name. Warning, never error.
 *  21a (notice)  a pinned version is AHEAD of `latest` — an intentional
 *                prerelease/canary pin (e.g. Kit 8 canary). Informational.
 *  21b (notice)  the registry could not be reached for one or more packages
 *                (timeout, network error, 5xx). Skipped, NOT failed — a red
 *                build on registry flakiness is exactly the outcome to avoid.
 *
 * A lesson with no `versionStamp` is checked by nothing: the field is opt-in,
 * existing content carries none, and this gate makes ZERO network calls when no
 * stamp is present (the early return below), so it never slows or flakes the
 * suites of unrelated gates.
 */

/** Per-request bound on the registry call — flakiness must degrade to a notice, never hang CI. */
const REGISTRY_TIMEOUT_MS = 5000;
const REGISTRY_BASE = "https://registry.npmjs.org";

export type FetchResult =
  | { ok: true; latest: string }
  | { ok: false; reason: "not-found" | "unreachable" };

/** Resolve a package's `latest` dist-tag. Injected in tests; the default hits npm. */
export type FetchLatest = (pkg: string) => Promise<FetchResult>;

async function defaultFetchLatest(pkg: string): Promise<FetchResult> {
  // Scoped names carry a "/" that must be percent-encoded in the registry path.
  const url = `${REGISTRY_BASE}/${pkg.replace("/", "%2F")}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(REGISTRY_TIMEOUT_MS),
      // Abbreviated packument — smaller payload, still carries dist-tags.
      headers: { accept: "application/vnd.npm.install-v1+json" },
    });
    if (res.status === 404) return { ok: false, reason: "not-found" };
    if (!res.ok) return { ok: false, reason: "unreachable" };
    const body = (await res.json()) as {
      "dist-tags"?: { latest?: string };
    };
    const latest = body["dist-tags"]?.latest;
    if (!latest) return { ok: false, reason: "unreachable" };
    return { ok: true, latest };
  } catch {
    // Timeout, DNS failure, offline — anything at the transport layer.
    return { ok: false, reason: "unreachable" };
  }
}

const NUM = /^\d+$/;

/**
 * Semver 2.0 precedence: -1 / 0 / 1 for a<b / a==b / a>b. Compares major.minor
 * .patch numerically, then applies prerelease precedence (a version WITH a
 * prerelease is LOWER than the same version without; build metadata is ignored).
 * Inputs are already exact semver — the schema guarantees the shape.
 */
export function compareSemver(a: string, b: string): number {
  const [aCore, aPre] = stripBuild(a);
  const [bCore, bPre] = stripBuild(b);
  const an = aCore.split(".").map(Number);
  const bn = bCore.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (an[i]! !== bn[i]!) return an[i]! < bn[i]! ? -1 : 1;
  }
  // Equal cores: no-prerelease outranks a prerelease.
  if (aPre === undefined && bPre === undefined) return 0;
  if (aPre === undefined) return 1;
  if (bPre === undefined) return -1;
  return comparePrerelease(aPre, bPre);
}

function stripBuild(v: string): [string, string | undefined] {
  const noBuild = v.split("+")[0]!;
  const dash = noBuild.indexOf("-");
  return dash === -1
    ? [noBuild, undefined]
    : [noBuild.slice(0, dash), noBuild.slice(dash + 1)];
}

function comparePrerelease(a: string, b: string): number {
  const ai = a.split(".");
  const bi = b.split(".");
  const len = Math.max(ai.length, bi.length);
  for (let i = 0; i < len; i++) {
    // A longer set of identifiers outranks a shorter prefix of it.
    if (i >= ai.length) return -1;
    if (i >= bi.length) return 1;
    const x = ai[i]!;
    const y = bi[i]!;
    const xn = NUM.test(x);
    const yn = NUM.test(y);
    if (xn && yn) {
      const nx = Number(x);
      const ny = Number(y);
      if (nx !== ny) return nx < ny ? -1 : 1;
    } else if (xn !== yn) {
      // Numeric identifiers always have lower precedence than alphanumeric.
      return xn ? -1 : 1;
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

export interface Gate21Options {
  fetchLatest?: FetchLatest;
}

export async function gate21Check(
  model: RepoModel,
  opts: Gate21Options = {}
): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];

  const stamped = model.lessons.filter((l) => l.lesson.versionStamp);
  // No stamp anywhere ⇒ nothing to check AND no network call. Keeps every other
  // gate's test suite offline and fast.
  if (stamped.length === 0) return out;

  const fetchLatest = opts.fetchLatest ?? defaultFetchLatest;

  // Dedupe registry lookups: a whole course pins the same stack, so the same
  // package appears in many lessons. One query per distinct package.
  const packages = new Set<string>();
  for (const entry of stamped) {
    for (const name of Object.keys(entry.lesson.versionStamp!.packages)) {
      packages.add(name);
    }
  }

  const resolved = new Map<string, FetchResult>();
  await Promise.all(
    [...packages].map(async (name) => {
      try {
        resolved.set(name, await fetchLatest(name));
      } catch {
        resolved.set(name, { ok: false, reason: "unreachable" });
      }
    })
  );

  // 21b — registry unreachable: aggregate into ONE repo-level notice so a full
  // outage produces a single line, not one per package. Never an error.
  const unreachable = [...packages]
    .filter((p) => {
      const r = resolved.get(p);
      return r && !r.ok && r.reason === "unreachable";
    })
    .sort();
  if (unreachable.length > 0) {
    out.push(
      diag(
        "gate-21b",
        "notice",
        "",
        `npm registry unreachable for ${unreachable.length} package(s) (${unreachable.join(
          ", "
        )}); version-stamp currency check skipped for those`
      )
    );
  }

  // 21a — per-lesson drift. One diagnostic per lesson listing all its findings,
  // so a stale stack across a course reads as one line per lesson, not per pin.
  for (const entry of stamped) {
    const stamp = entry.lesson.versionStamp!;
    const behind: string[] = [];
    const notFound: string[] = [];
    const ahead: string[] = [];

    for (const [name, pinned] of Object.entries(stamp.packages)) {
      const r = resolved.get(name);
      if (!r || !r.ok) {
        if (r && r.reason === "not-found") notFound.push(name);
        // "unreachable" is already covered by the 21b notice; skip silently here.
        continue;
      }
      const cmp = compareSemver(pinned, r.latest);
      if (cmp < 0) {
        behind.push(`${name} pinned ${pinned}, registry latest ${r.latest}`);
      } else if (cmp > 0) {
        ahead.push(
          `${name} pinned ${pinned}, ahead of registry latest ${r.latest}`
        );
      }
    }

    if (behind.length > 0 || notFound.length > 0) {
      const parts: string[] = [];
      if (behind.length > 0) parts.push(`behind latest: ${behind.join("; ")}`);
      if (notFound.length > 0) {
        parts.push(`not on the npm registry: ${notFound.join(", ")}`);
      }
      out.push(
        diag(
          "gate-21a",
          "warning",
          entry.file,
          `version stamp is stale (last checked ${stamp.checkedAt}) — ${parts.join(
            "; "
          )}. Re-verify this lesson against the current stack and bump checkedAt, or correct the package name`
        )
      );
    } else if (ahead.length > 0) {
      out.push(
        diag(
          "gate-21a",
          "notice",
          entry.file,
          `version stamp pins ahead of latest (intentional prerelease pin?): ${ahead.join(
            "; "
          )}`
        )
      );
    }
  }

  return out;
}

registerCheck((model) => gate21Check(model));
