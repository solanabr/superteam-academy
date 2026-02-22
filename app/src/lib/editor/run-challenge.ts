import { transform } from "sucrase";
import type { ChallengeData } from "@/types/course";

export interface TestResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export interface RunResult {
  results: TestResult[];
  allPassed: boolean;
}

const CDN = "https://esm.sh";
const TIMEOUT_MS = 10_000;
const MSG_TYPE = "__challenge__";

/** Rewrites bare npm specifiers to esm.sh CDN URLs so any package resolves natively. */
function rewriteImports(code: string): string {
  return code.replace(
    /from\s*['"]([^'"./][^'"]*)['"]/g,
    (_, pkg) => `from '${CDN}/${pkg}'`,
  );
}

/** Strips TypeScript type annotations. Falls back to raw code on parse error. */
function stripTypes(code: string): string {
  try {
    return transform(code, { transforms: ["typescript"], disableESTransforms: true }).code;
  } catch {
    return code;
  }
}

/** Builds the async test runner injected after user code inside the iframe. */
function buildTestRunner(testCases: ChallengeData["testCases"], fnName: string): string {
  const cases = testCases.map((tc) => {
    const rawInput = JSON.stringify(tc.input);
    const expectedDisplay = JSON.stringify(
      tc.validator ? `validator: ${tc.validator}` : tc.expectedOutput,
    );
    const passExpr = tc.validator
      ? `(function(output){return(${tc.validator})})(__actual)`
      : `__actual===${JSON.stringify(tc.expectedOutput.trim())}`;

    return `
  try {
    const __raw = ${rawInput};
    const __args = __raw === '' ? [] : __raw.split(',').map(s => {
      s = s.trim();
      if ((s.startsWith('"')&&s.endsWith('"'))||(s.startsWith("'")&&s.endsWith("'"))) return s.slice(1,-1);
      const n = Number(s);
      return (!isNaN(n) && s !== '') ? n : s;
    });
    const __actual = String(
      await Promise.resolve(typeof ${fnName} === 'function' ? ${fnName}.apply(null, __args) : undefined)
    ).trim();
    results.push({
      label: ${JSON.stringify(tc.label)},
      passed: !!(${passExpr}),
      expected: ${expectedDisplay},
      actual: __actual,
    });
  } catch(e) {
    results.push({
      label: ${JSON.stringify(tc.label)},
      passed: false,
      expected: ${expectedDisplay},
      actual: e instanceof Error ? e.message : String(e),
    });
  }`;
  }).join("\n");

  return `(async () => {
  const results = [];
  ${cases}
  window.parent.postMessage({ type: '${MSG_TYPE}', results }, '*');
})();`;
}

// Error handler script injected before the module — catches syntax/parse errors
// that would otherwise silently hang until the 10s timeout.
const ERROR_HANDLER = `<script>
window.onerror = function(msg, _src, _line, _col, err) {
  window.parent.postMessage({ type: '${MSG_TYPE}', error: err ? err.message : msg }, '*');
  return true;
};
window.addEventListener('unhandledrejection', function(ev) {
  window.parent.postMessage({
    type: '${MSG_TYPE}',
    error: ev.reason instanceof Error ? ev.reason.message : String(ev.reason)
  }, '*');
});
</script>`;

/**
 * Runs a JSON challenge without the iframe. Parses the user's JSON and runs
 * validators against the parsed value. Validators receive `output` (raw string)
 * and `parsed` (the JS value).
 */
function runJsonChallenge(code: string, challenge: ChallengeData): RunResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(code);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON";
    return {
      results: challenge.testCases.map((tc) => ({
        label: tc.label,
        passed: false,
        expected: tc.validator ? `validator: ${tc.validator}` : tc.expectedOutput,
        actual: msg,
      })),
      allPassed: false,
    };
  }

  const results: TestResult[] = challenge.testCases.map((tc) => {
    const expectedDisplay = tc.validator ? `validator: ${tc.validator}` : tc.expectedOutput;
    try {
      let passed: boolean;
      if (tc.validator) {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        passed = !!new Function("output", "parsed", `return (${tc.validator})`)(code, parsed);
      } else {
        passed = JSON.stringify(parsed) === tc.expectedOutput.trim();
      }
      return { label: tc.label, passed, expected: expectedDisplay, actual: JSON.stringify(parsed) };
    } catch (e) {
      return {
        label: tc.label,
        passed: false,
        expected: expectedDisplay,
        actual: e instanceof Error ? e.message : "Error",
      };
    }
  });

  return { results, allPassed: results.every((r) => r.passed) };
}

/**
 * Executes a coding challenge against its test cases.
 *
 * TypeScript/Rust challenges run in a sandboxed iframe with native ES module support:
 *   1. sucrase strips TypeScript type annotations
 *   2. bare npm imports rewritten to esm.sh CDN URLs — any package, no allowlist
 *   3. test runner injected as <script type="module"> with a global error handler
 *   4. results (or errors) posted back via postMessage
 *
 * JSON challenges are validated synchronously — JSON.parse + validator expression.
 */
export function runChallenge(code: string, challenge: ChallengeData): Promise<RunResult> {
  if (typeof document === "undefined") {
    return Promise.resolve({ results: [], allPassed: false });
  }

  if (challenge.language === "json") {
    return Promise.resolve(runJsonChallenge(code, challenge));
  }

  return new Promise((resolve) => {
    const fnName = challenge.starterCode.match(/function\s+(\w+)/)?.[1] ?? "solution";
    const script = rewriteImports(stripTypes(code)) + "\n" + buildTestRunner(challenge.testCases, fnName);

    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.cssText = "display:none;position:absolute;width:0;height:0;";

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({
        results: challenge.testCases.map((tc) => ({
          label: tc.label,
          passed: false,
          expected: tc.expectedOutput,
          actual: "Timed out — possible infinite loop",
        })),
        allPassed: false,
      });
    }, TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
      iframe.remove();
    }

    function onMessage(ev: MessageEvent) {
      if (ev.source !== iframe.contentWindow) return;
      if (ev.data?.type !== MSG_TYPE) return;
      cleanup();

      // Syntax/runtime error caught by the iframe's global error handler
      if (ev.data.error) {
        resolve({
          results: challenge.testCases.map((tc) => ({
            label: tc.label,
            passed: false,
            expected: tc.validator ? `validator: ${tc.validator}` : tc.expectedOutput,
            actual: ev.data.error as string,
          })),
          allPassed: false,
        });
        return;
      }

      const results = ev.data.results as TestResult[];
      resolve({ results, allPassed: results.every((r) => r.passed) });
    }

    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);

    iframe.srcdoc = [
      "<!doctype html><html><body>",
      ERROR_HANDLER,
      `<script type="module">\n${script}\n</script>`,
      "</body></html>",
    ].join("");
  });
}
