import { NextRequest, NextResponse } from "next/server";
import {
  getJDoodleLanguageConfig,
  executeJDoodle,
  type SupportedLanguage,
} from "@/lib/jdoodle";

type RunCodePayload = {
  language: SupportedLanguage;
  code: string;
  testCases?: Array<{ name?: string; input?: string; expected?: string }>;
};

type TestResult = {
  name: string;
  passed: boolean;
  input?: string;
  expected?: string;
  actual?: string;
  error?: string;
};

type RunCodeResponse = {
  passed: boolean;
  stdout: string;
  stderr: string;
  testResults?: TestResult[];
  memory?: string;
  cpuTime?: string;
  /** Set when JDoodle returns 429 (daily API limit reached) */
  dailyLimitReached?: boolean;
};

/**
 * Code execution API using JDoodle Compiler API.
 * Executes code in a sandboxed environment and returns output/test results.
 */
export async function POST(request: NextRequest) {
  // Validate environment variables
  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        passed: false,
        stdout: "",
        stderr: "JDoodle API credentials not configured. Please set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET.",
      },
      { status: 500 }
    );
  }

  let body: RunCodePayload;

  try {
    body = (await request.json()) as RunCodePayload;
  } catch {
    return NextResponse.json(
      { passed: false, stdout: "", stderr: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (!body.code || !body.code.trim()) {
    return NextResponse.json(
      {
        passed: false,
        stdout: "",
        stderr: "No code provided. Please write a solution before running tests.",
      },
      { status: 400 }
    );
  }

  const { language, code, testCases = [] } = body;

  // Get JDoodle language configuration
  const langConfig = getJDoodleLanguageConfig(language);
  if (!langConfig) {
    return NextResponse.json(
      {
        passed: false,
        stdout: "",
        stderr: `Unsupported language: ${language}. Supported languages: rust, typescript, javascript.`,
      },
      { status: 400 }
    );
  }

  // Handle JSON - validate syntax only
  if (language === "json") {
    try {
      JSON.parse(code);
      return NextResponse.json({
        passed: true,
        stdout: "✓ Valid JSON syntax",
        stderr: "",
      });
    } catch (err) {
      return NextResponse.json({
        passed: false,
        stdout: "",
        stderr: `JSON parse error: ${err instanceof Error ? err.message : "Invalid JSON"}`,
      });
    }
  }

  try {
    // If there are test cases, run each one individually
    if (testCases.length > 0) {
      const testResults: TestResult[] = [];
      let allPassed = true;
      const outputLines: string[] = [];

      for (const [idx, testCase] of testCases.entries()) {
        const testName = testCase.name || `Test ${idx + 1}`;
        outputLines.push(`\n> Running ${testName}...`);

        try {
          let jdoodleResponse;
          try {
            jdoodleResponse = await executeJDoodle({
              clientId,
              clientSecret,
              script: code,
              language: langConfig.language,
              versionIndex: langConfig.versionIndex,
              stdin: testCase.input || "",
            });
          } catch (limitErr) {
            if (limitErr instanceof Error && limitErr.message === "DAILY_LIMIT_REACHED") {
              return NextResponse.json({
                passed: false,
                stdout: "",
                stderr: "Daily code compiling limit reached. Please try again in 24 hours.",
                dailyLimitReached: true,
              } satisfies RunCodeResponse);
            }
            throw limitErr;
          }

          // Check for compilation errors
          if (jdoodleResponse.compilationStatus !== null && jdoodleResponse.compilationStatus !== 0) {
            // Combine output and error for complete error message
            const errorMsg = jdoodleResponse.error || "Compilation failed";
            const fullError = jdoodleResponse.output 
              ? `${jdoodleResponse.output}\n${errorMsg}`
              : errorMsg;
            
            testResults.push({
              name: testName,
              passed: false,
              input: testCase.input,
              expected: testCase.expected,
              error: fullError,
            });
            allPassed = false;
            outputLines.push(`✗ ${testName}: Compilation failed`);
            if (fullError) {
              outputLines.push(`  ${fullError}`);
            }
            continue;
          }

          // Check execution success
          if (!jdoodleResponse.isExecutionSuccess) {
            // Combine output and error for complete error message
            const errorMsg = jdoodleResponse.error || "Execution failed";
            const fullError = jdoodleResponse.output 
              ? `${jdoodleResponse.output}\n${errorMsg}`
              : errorMsg;
            
            testResults.push({
              name: testName,
              passed: false,
              input: testCase.input,
              expected: testCase.expected,
              error: fullError,
            });
            allPassed = false;
            outputLines.push(`✗ ${testName}: Execution failed`);
            if (fullError) {
              outputLines.push(`  ${fullError}`);
            }
            continue;
          }

          // Get actual output (trimmed for comparison)
          const actualOutput = (jdoodleResponse.output || "").trim();
          const expectedOutput = (testCase.expected || "").trim();

          // Compare outputs
          const passed = actualOutput === expectedOutput;
          if (!passed) {
            allPassed = false;
          }

          testResults.push({
            name: testName,
            passed,
            input: testCase.input,
            expected: expectedOutput,
            actual: actualOutput,
          });

          if (passed) {
            outputLines.push(`✓ ${testName}: Passed`);
          } else {
            outputLines.push(`✗ ${testName}: Failed`);
            outputLines.push(`  Expected: ${expectedOutput}`);
            outputLines.push(`  Got: ${actualOutput}`);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          testResults.push({
            name: testName,
            passed: false,
            input: testCase.input,
            expected: testCase.expected,
            error: errorMsg,
          });
          allPassed = false;
          outputLines.push(`✗ ${testName}: ${errorMsg}`);
        }
      }

      return NextResponse.json({
        passed: allPassed,
        stdout: outputLines.join("\n"),
        stderr: "",
        testResults,
      } satisfies RunCodeResponse);
    } else {
      // No test cases - just execute the code and return output
      try {
        let jdoodleResponse;
        try {
          jdoodleResponse = await executeJDoodle({
            clientId,
            clientSecret,
            script: code,
            language: langConfig.language,
            versionIndex: langConfig.versionIndex,
          });
        } catch (limitErr) {
          if (limitErr instanceof Error && limitErr.message === "DAILY_LIMIT_REACHED") {
            return NextResponse.json({
              passed: false,
              stdout: "",
              stderr: "Daily code compiling limit reached. Please try again in 24 hours.",
              dailyLimitReached: true,
            } satisfies RunCodeResponse);
          }
          throw limitErr;
        }

        // Check for compilation errors
        if (jdoodleResponse.compilationStatus !== null && jdoodleResponse.compilationStatus !== 0) {
          // JDoodle returns compilation errors in the 'error' field
          const errorOutput = jdoodleResponse.error || "Compilation failed";
          // Also include any output that might contain error details
          const combinedError = jdoodleResponse.output 
            ? `${jdoodleResponse.output}\n${errorOutput}`
            : errorOutput;
          
          return NextResponse.json({
            passed: false,
            stdout: jdoodleResponse.output || "", // Include any partial output
            stderr: combinedError,
            memory: jdoodleResponse.memory,
            cpuTime: jdoodleResponse.cpuTime,
          } satisfies RunCodeResponse);
        }

        // Check execution success
        if (!jdoodleResponse.isExecutionSuccess) {
          // JDoodle returns runtime errors in the 'error' field
          const errorOutput = jdoodleResponse.error || "Execution failed";
          // Combine output and error for complete error message
          const combinedError = jdoodleResponse.output 
            ? `${jdoodleResponse.output}\n${errorOutput}`
            : errorOutput;
          
          return NextResponse.json({
            passed: false,
            stdout: jdoodleResponse.output || "", // Include any partial output before error
            stderr: combinedError,
            memory: jdoodleResponse.memory,
            cpuTime: jdoodleResponse.cpuTime,
          } satisfies RunCodeResponse);
        }

        // Success - return output and any warnings/errors (some languages output warnings to stderr)
        return NextResponse.json({
          passed: true,
          stdout: jdoodleResponse.output || "",
          stderr: jdoodleResponse.error || "", // Warnings or non-fatal errors
          memory: jdoodleResponse.memory,
          cpuTime: jdoodleResponse.cpuTime,
        } satisfies RunCodeResponse);
      } catch (err) {
        return NextResponse.json(
          {
            passed: false,
            stdout: "",
            stderr: err instanceof Error ? err.message : "Failed to execute code",
          } satisfies RunCodeResponse,
          { status: 500 }
        );
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("JDoodle API error:", err);
    if (err instanceof Error && err.message === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({
        passed: false,
        stdout: "",
        stderr: "Daily code compiling limit reached. Please try again in 24 hours.",
        dailyLimitReached: true,
      } satisfies RunCodeResponse);
    }
    return NextResponse.json(
      {
        passed: false,
        stdout: "",
        stderr: err instanceof Error ? err.message : "Unknown error occurred",
      } satisfies RunCodeResponse,
      { status: 500 }
    );
  }
}

