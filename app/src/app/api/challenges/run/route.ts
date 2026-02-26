import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";

// ─── Types ──────────────────────────────────────────────
interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  output?: string;
  hidden: boolean;
}

interface SanityTestCase {
  _key: string;
  name: string;
  expectedOutput: string;
  hidden?: boolean;
}

interface SanityLesson {
  _key: string;
  challenge?: {
    testCases?: SanityTestCase[];
  };
}

interface SanityModule {
  lessons?: SanityLesson[];
}

interface SanityCourse {
  modules?: SanityModule[];
}

// ─── Helpers ────────────────────────────────────────────

/** Strip single-line and multi-line comments from code. */
function stripComments(source: string): string {
  // Handle strings to avoid stripping "// inside strings"
  let result = "";
  let i = 0;
  while (i < source.length) {
    // String literals — skip through them
    if (source[i] === '"' || source[i] === "'" || source[i] === "`") {
      const quote = source[i];
      result += source[i++];
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\" && i + 1 < source.length) {
          result += source[i++]; // backslash
        }
        result += source[i++];
      }
      if (i < source.length) result += source[i++]; // closing quote
    }
    // Multi-line comment
    else if (source[i] === "/" && i + 1 < source.length && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && i + 1 < source.length && source[i + 1] === "/")) {
        i++;
      }
      i += 2; // skip */
      result += " "; // preserve whitespace
    }
    // Single-line comment
    else if (source[i] === "/" && i + 1 < source.length && source[i + 1] === "/") {
      i += 2;
      while (i < source.length && source[i] !== "\n") i++;
    }
    // Normal character
    else {
      result += source[i++];
    }
  }
  return result;
}

// ─── Route ──────────────────────────────────────────────

/**
 * POST /api/challenges/run
 *
 * Validates user code against test cases stored in Sanity (server-side).
 * The client never sees hidden test case patterns.
 *
 * Body: { courseSlug: string, lessonId: string, code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseSlug, lessonId, code } = body;

    if (!courseSlug || !lessonId || typeof code !== "string") {
      return NextResponse.json(
        { error: "Missing courseSlug, lessonId, or code" },
        { status: 400 },
      );
    }

    // Fetch test cases from Sanity — never trust the client
    const query = `*[_type == "course" && slug.current == $slug][0] {
      "modules": modules[] {
        "lessons": lessons[] {
          _key,
          "challenge": challenge {
            "testCases": testCases[] {
              _key,
              name,
              expectedOutput,
              hidden
            }
          }
        }
      }
    }`;

    const course = await sanityClient.fetch<SanityCourse | null>(query, {
      slug: courseSlug,
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Find the lesson's test cases
    let testCases: SanityTestCase[] | undefined;
    for (const mod of course.modules ?? []) {
      for (const lesson of mod.lessons ?? []) {
        if (lesson._key === lessonId && lesson.challenge?.testCases) {
          testCases = lesson.challenge.testCases;
          break;
        }
      }
      if (testCases) break;
    }

    if (!testCases || testCases.length === 0) {
      return NextResponse.json(
        { error: "No test cases found for this lesson" },
        { status: 404 },
      );
    }

    // Strip comments so patterns in comments don't count
    const strippedCode = stripComments(code);

    // Run pattern matching
    const results: TestCaseResult[] = testCases.map((tc) => {
      const passed = strippedCode.includes(tc.expectedOutput);
      return {
        id: tc._key,
        name: tc.name,
        passed,
        // Only reveal expected output for visible tests that failed
        output: !passed && !tc.hidden ? "Pattern not found in code" : undefined,
        hidden: tc.hidden ?? false,
      };
    });

    const allPassed = results.every((r) => r.passed);

    // Return results — hidden test names/outputs are redacted for the client
    const clientResults = results.map((r) => ({
      id: r.id,
      name: r.hidden ? "Hidden test" : r.name,
      passed: r.passed,
      output: r.hidden ? undefined : r.output,
      hidden: r.hidden,
    }));

    return NextResponse.json({
      passed: allPassed,
      results: clientResults,
      totalTests: results.length,
      passedTests: results.filter((r) => r.passed).length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Challenge validation failed", details: message },
      { status: 500 },
    );
  }
}
