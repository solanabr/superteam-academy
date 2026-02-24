import * as esbuild from "esbuild-wasm";

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initTranspiler(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = esbuild
    .initialize({ wasmURL: "/esbuild.wasm" })
    .then(() => {
      initialized = true;
    })
    .catch((err) => {
      initPromise = null;
      throw err;
    });

  return initPromise;
}

/**
 * Inject timeout checks into while/for/do-while loops to prevent infinite loops.
 * Uses a simple regex-based approach (no Babel dependency).
 */
function injectLoopProtection(code: string, limitMs = 4000): string {
  const marker = `var __lp_start=Date.now(),__lp_limit=${limitMs};`;
  const check = `if(Date.now()-__lp_start>__lp_limit)throw new Error("Infinite loop detected ("+(__lp_limit/1000)+"s limit)");`;

  // Match while(...){, for(...){, do {
  // Insert the check after the opening brace
  let result = code.replace(
    /((?:while|for)\s*\([^)]*\)\s*\{)/g,
    `$1${check}`,
  );
  result = result.replace(/(do\s*\{)/g, `$1${check}`);

  return marker + result;
}

export interface TranspileResult {
  code: string;
  error: string | null;
}

export async function transpileAndProtect(
  tsCode: string,
): Promise<TranspileResult> {
  try {
    await initTranspiler();

    const result = await esbuild.transform(tsCode, {
      loader: "ts",
      target: "es2020",
      format: "esm",
    });

    if (result.warnings.length > 0) {
      const warns = result.warnings
        .map((w) => `${w.text} (line ${w.location?.line ?? "?"})`)
        .join("\n");
      console.warn("esbuild warnings:", warns);
    }

    const protected_ = injectLoopProtection(result.code);
    return { code: protected_, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : String(err);
    return { code: "", error: message };
  }
}
