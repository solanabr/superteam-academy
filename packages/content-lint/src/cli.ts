import { runLint } from "./lint";
import type { Diagnostic } from "./diagnostics";
// Side-effect import: running `./index` executes every check module's top-level
// `registerCheck` / `registerSchemaCheck`, so the CLI lints with all gates
// registered (without it, no gate runs and every repo trivially "passes").
import "./index";

function normalizeBaseRef(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // GITHUB_BASE_REF is a bare branch name ("main"); a full ref is used verbatim.
  return raw.includes("/") ? raw : `origin/${raw}`;
}

function format(d: Diagnostic): string {
  const where = d.file ? ` ${d.file}` : "";
  return `[${d.severity}] ${d.gate}${where}: ${d.message}`;
}

async function main(): Promise<void> {
  const root = process.argv[2] ?? process.cwd();
  const baseRef = normalizeBaseRef(
    process.env.LINT_BASE_REF ?? process.env.GITHUB_BASE_REF
  );
  const { diagnostics, ok } = await runLint(root, { baseRef });

  for (const d of diagnostics.filter((x) => x.severity === "notice")) {
    console.log(format(d));
  }
  for (const d of diagnostics.filter((x) => x.severity === "warning")) {
    console.warn(format(d));
  }
  for (const d of diagnostics.filter((x) => x.severity === "error")) {
    console.error(format(d));
  }

  const errors = diagnostics.filter((d) => d.severity === "error").length;
  console.log(
    ok
      ? `content-lint: OK (${diagnostics.length} diagnostics, 0 errors)`
      : `content-lint: FAILED (${errors} error${errors === 1 ? "" : "s"})`
  );
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("content-lint crashed:", err);
  process.exit(2);
});
