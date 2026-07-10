interface GradeResult {
  passed: boolean;
  failures: string[];
}
type Grader = (code: string, tests: unknown[]) => Promise<GradeResult>;

/** The three execution tiers of §6.2a, injectable so the orchestrator wires the
 *  real executors and tests wire fakes. */
export interface GraderSet {
  js: Grader; // QuickJS-in-WASM (runJsSubmission), pure Node
  rust: Grader; // rustc/cargo on the runner (or Playground fallback)
  buildable: Grader; // cargo build-sbf / Anchor build server
}

interface CodeBlockLike {
  key: string;
  type: string;
  language: "typescript" | "rust";
  buildType: "standard" | "buildable";
}

interface CodeFiles {
  starter: string;
  solution: string;
  tests: unknown[];
}

function pickGrader(block: CodeBlockLike, graders: GraderSet): Grader {
  if (block.buildType === "buildable") return graders.buildable;
  return block.language === "rust" ? graders.rust : graders.js;
}

/**
 * Two-sided gate (spec §3, §6.2 gate 6): the reference solution must pass every
 * test and the starter must fail at least one. Returns human-readable issue
 * strings prefixed with the block key; empty means the block is well-formed.
 */
export async function gateCodeBlock(
  block: CodeBlockLike,
  files: CodeFiles,
  graders: GraderSet
): Promise<string[]> {
  const issues: string[] = [];
  const grader = pickGrader(block, graders);

  const sol = await grader(files.solution, files.tests);
  if (!sol.passed) {
    issues.push(
      `block "${block.key}": solution does not pass its own tests (${sol.failures.join("; ")})`
    );
  }

  const starter = await grader(files.starter, files.tests);
  if (starter.passed) {
    issues.push(
      `block "${block.key}": starter already passes — there is nothing to solve`
    );
  }

  return issues;
}
