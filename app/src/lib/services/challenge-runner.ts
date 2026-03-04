import type { InferSelectModel } from "drizzle-orm";
import type { challenges } from "@/lib/db/schema";

type ChallengeRow = InferSelectModel<typeof challenges>;

type TestCase = NonNullable<ChallengeRow["test_cases"]>[number];

export type ChallengeRunResult = {
  passed: boolean;
  details: { index: number; input: string; expected: string; actual: string }[];
};

export async function run_challenge_tests(
  solution_code: string,
  challenge: ChallengeRow,
): Promise<ChallengeRunResult> {
  const test_cases: TestCase[] = challenge.test_cases ?? [];
  if (test_cases.length === 0) {
    return { passed: true, details: [] };
  }

  // For now, only support JS/TS challenges
  if (challenge.language !== "javascript" && challenge.language !== "typescript") {
    return { passed: false, details: [] };
  }

  const details: ChallengeRunResult["details"] = [];
  let allPassed = true;

  for (let i = 0; i < test_cases.length; i++) {
    const tc = test_cases[i]!;
    try {
      // Expect user solution to define a function named `solve`
      // eslint-disable-next-line no-new-func
      const fnFactory = new Function(`${solution_code}; return typeof solve === "function" ? solve : null;`);
      const solve = fnFactory();
      if (!solve) {
        allPassed = false;
        details.push({
          index: i,
          input: tc.input,
          expected: tc.expected,
          actual: "[no solve() function]",
        });
        continue;
      }

      const input = tc.input ? JSON.parse(tc.input) : undefined;
      const expected = tc.expected ? JSON.parse(tc.expected) : undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const actualValue = solve(input);
      const actual = JSON.stringify(actualValue);

      const expectedStr = JSON.stringify(expected);
      const passed = actual === expectedStr;
      if (!passed) {
        allPassed = false;
      }

      details.push({
        index: i,
        input: tc.input,
        expected: tc.expected,
        actual,
      });
    } catch (err) {
      allPassed = false;
      details.push({
        index: i,
        input: tc.input,
        expected: tc.expected,
        actual: err instanceof Error ? err.message : "Error",
      });
    }
  }

  return { passed: allPassed, details };
}

