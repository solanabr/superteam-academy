import { discover } from "./loader";
import { emptyModel, type RepoModel } from "./model";
import {
  diag,
  summarize,
  type Diagnostic,
  type LintResult,
} from "./diagnostics";

export interface LintContext {
  root: string;
  baseRef?: string;
}

export type Check = (
  model: RepoModel,
  ctx: LintContext
) => Diagnostic[] | Promise<Diagnostic[]>;

/**
 * Gate 1 (checks/gate1-schema.ts) is special: it consumes the raw parsed docs
 * and PRODUCES the typed RepoModel. It is registered as `schemaCheck` so later
 * checks receive a populated model. Registered by Task 3.
 */
export let schemaCheck:
  | ((root: string, diagnostics: Diagnostic[]) => RepoModel)
  | undefined;
export function registerSchemaCheck(fn: typeof schemaCheck): void {
  schemaCheck = fn;
}

/** Gates 2..13. Appended by later tasks via `registerCheck`. */
export const CHECKS: Check[] = [];
export function registerCheck(check: Check): void {
  CHECKS.push(check);
}

export async function runLint(
  root: string,
  opts: { baseRef?: string } = {}
): Promise<LintResult> {
  const diagnostics: Diagnostic[] = [];

  // Parse-phase diagnostics (loader): a file that will not even parse.
  for (const doc of discover(root)) {
    if (doc.parseError) {
      diagnostics.push(
        diag("parse", "error", doc.path, `failed to parse: ${doc.parseError}`)
      );
    }
  }

  const model = schemaCheck ? schemaCheck(root, diagnostics) : emptyModel(root);

  const ctx: LintContext = { root, baseRef: opts.baseRef };
  for (const check of CHECKS) {
    diagnostics.push(...(await check(model, ctx)));
  }

  return summarize(diagnostics);
}
