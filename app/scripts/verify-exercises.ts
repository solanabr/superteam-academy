/**
 * Verify all coding exercises have valid test cases.
 *
 * Checks:
 * 1. Every challenge has at least one test case
 * 2. Every test case has at least one modern assertion field
 *    (expectCodeContains, expectNoError, expectLogContains, expectLogMatch)
 * 3. expectCodeContains patterns are found in the solution code
 *
 * Run: npx tsx scripts/verify-exercises.ts
 */

import { courses } from "../src/lib/services/curriculum-data";

interface Result {
  exerciseId: string;
  title: string;
  passed: boolean;
  failures: string[];
}

const MODERN_FIELDS = [
  "expectCodeContains",
  "expectNoError",
  "expectLogContains",
  "expectLogMatch",
] as const;

function verify(): Result[] {
  const results: Result[] = [];

  for (const course of courses) {
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.type !== "challenge" || !lesson.challenge) continue;

        const { challenge } = lesson;
        const failures: string[] = [];

        if (challenge.testCases.length === 0) {
          failures.push("No test cases defined");
        }

        for (const tc of challenge.testCases) {
          const hasModern = MODERN_FIELDS.some(
            (f) => (tc as Record<string, unknown>)[f] !== undefined,
          );
          if (!hasModern) {
            failures.push(
              `Test "${tc.name}" has no modern assertion fields (only legacy expectedOutput)`,
            );
          }

          // Validate expectCodeContains against solution
          if (tc.expectCodeContains) {
            if (!challenge.solution.includes(tc.expectCodeContains)) {
              failures.push(
                `Test "${tc.name}": expectCodeContains "${tc.expectCodeContains}" NOT found in solution`,
              );
            }
          }

          // Validate expectLogMatch is valid regex
          if (tc.expectLogMatch) {
            try {
              new RegExp(tc.expectLogMatch);
            } catch {
              failures.push(
                `Test "${tc.name}": expectLogMatch "${tc.expectLogMatch}" is invalid regex`,
              );
            }
          }
        }

        results.push({
          exerciseId: lesson.id,
          title: lesson.title,
          passed: failures.length === 0,
          failures,
        });
      }
    }
  }

  return results;
}

// Run
const results = verify();
const passed = results.filter((r) => r.passed);
const failed = results.filter((r) => !r.passed);

console.log(`\n=== Exercise Verification ===\n`);

for (const r of results) {
  const icon = r.passed ? "PASS" : "FAIL";
  console.log(`[${icon}] ${r.exerciseId} — ${r.title}`);
  for (const f of r.failures) {
    console.log(`       ${f}`);
  }
}

console.log(`\n${passed.length}/${results.length} exercises passed`);

if (failed.length > 0) {
  console.log(`\nFailed exercises:`);
  for (const r of failed) {
    console.log(`  - ${r.exerciseId}: ${r.title}`);
  }
  process.exit(1);
}

console.log("\nAll exercises valid!");
