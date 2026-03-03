/**
 * POST /api/code/execute
 *
 * Proxies code execution to a self-hosted Judge0 CE instance.
 *
 * Flow:
 * 1. Authenticate user via session
 * 2. Rate limit (lenient tier — 20 req/min)
 * 3. Validate request body (language, code, optional test cases)
 * 4. Forward code to Judge0 CE for sandboxed execution
 * 5. If test cases provided, run once per test case with stdin
 * 6. Return stdout, stderr, exit code, and optional test results
 *
 * Env vars:
 *   CODE_EXECUTION_API_URL — Judge0 CE base URL (your VPS, required)
 *   CODE_EXECUTION_AUTH_TOKEN — X-Auth-Token for Judge0 (from judge0.conf AUTHN_TOKEN)
 *   CODE_EXECUTION_TIMEOUT_MS — max execution timeout
 *   CODE_EXECUTION_MAX_CODE_SIZE — max code size in bytes
 *
 * Judge0 CE API: POST /submissions?base64_encoded=true&wait=true
 * Deploy guide: docs/judge0-vps-setup.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';

/**
 * Judge0 CE language IDs.
 * Full list: https://ce.judge0.com/languages
 */
const LANGUAGE_MAP: Record<string, { id: number; name: string }> = {
    rust: { id: 108, name: 'Rust (1.85.0)' },
    typescript: { id: 94, name: 'TypeScript (5.0.3)' },
    javascript: { id: 93, name: 'JavaScript (Node.js 18.15.0)' },
    python: { id: 100, name: 'Python (3.12.5)' },
};

interface ExecuteRequestBody {
    language: string;
    code: string;
    stdin?: string;
    testCases?: {
        name: string;
        input: string;
        expectedOutput: string;
        isHidden: boolean;
    }[];
}

/** Judge0 submission response */
interface Judge0Response {
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    message: string | null;
    status: {
        id: number;
        description: string;
    };
    time: string | null;
    memory: number | null;
}

/**
 * Judge0 status IDs:
 *   1 = In Queue
 *   2 = Processing
 *   3 = Accepted (ran successfully)
 *   4 = Wrong Answer
 *   5 = Time Limit Exceeded
 *   6 = Compilation Error
 *   7-12 = Runtime errors
 *   13 = Internal Error
 *   14 = Exec Format Error
 */

function getExecutionConfig() {
    const apiUrl = process.env.CODE_EXECUTION_API_URL;
    const authToken = process.env.CODE_EXECUTION_AUTH_TOKEN || '';
    const timeoutMs = parseInt(process.env.CODE_EXECUTION_TIMEOUT_MS || '10000', 10);
    const maxCodeSize = parseInt(process.env.CODE_EXECUTION_MAX_CODE_SIZE || '65536', 10);

    if (!apiUrl) {
        throw new Error('CODE_EXECUTION_API_URL is not configured. Deploy Judge0 CE on your VPS and set the URL.');
    }

    return { apiUrl, authToken, timeoutMs, maxCodeSize };
}

/** Base64 encode for Judge0 */
function b64Encode(str: string): string {
    return Buffer.from(str, 'utf-8').toString('base64');
}

/** Base64 decode from Judge0 */
function b64Decode(str: string | null): string {
    if (!str) return '';
    return Buffer.from(str, 'base64').toString('utf-8');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Check if code execution is enabled
        if (process.env.NEXT_PUBLIC_CODE_EXECUTION_ENABLED !== 'true') {
            return NextResponse.json(
                { error: 'Code execution is not enabled' },
                { status: 503 }
            );
        }

        // Rate limit — lenient tier (20 req/min)
        const ip = getClientIp(request);
        const { success: rateLimited, response: rateLimitResponse } =
            await checkRateLimit(`code-exec:${ip}`, 'lenient');
        if (!rateLimited) return rateLimitResponse as NextResponse;

        // Authenticate
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const config = getExecutionConfig();

        // Parse and validate request body
        const body: ExecuteRequestBody = await request.json();
        const { language, code, stdin, testCases } = body;

        if (!language || typeof language !== 'string') {
            return NextResponse.json(
                { error: 'language is required and must be a string' },
                { status: 400 }
            );
        }

        if (!code || typeof code !== 'string') {
            return NextResponse.json(
                { error: 'code is required and must be a string' },
                { status: 400 }
            );
        }

        // Validate code size
        const codeBytes = new TextEncoder().encode(code).length;
        if (codeBytes > config.maxCodeSize) {
            return NextResponse.json(
                {
                    error: `Code exceeds maximum size of ${config.maxCodeSize} bytes (got ${codeBytes})`,
                },
                { status: 400 }
            );
        }

        // Resolve language
        const lang = LANGUAGE_MAP[language];
        if (!lang) {
            return NextResponse.json(
                {
                    error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
                },
                { status: 400 }
            );
        }

        // Execute code via Judge0 (no test cases — single run)
        if (!testCases || testCases.length === 0) {
            const result = await executeJudge0(
                config,
                lang.id,
                code,
                stdin || '',
            );

            const stdout = b64Decode(result.stdout);
            const stderr = b64Decode(result.stderr);
            const compileOutput = b64Decode(result.compile_output);
            const isCompileError = result.status.id === 6;

            return NextResponse.json({
                success: true,
                output: {
                    stdout,
                    stderr: isCompileError ? compileOutput : stderr,
                    exitCode: result.status.id === 3 ? 0 : 1,
                    compilationError: isCompileError ? compileOutput : null,
                },
            });
        }

        // Execute with test cases — run code once per test case with different stdin
        const testResults = [];
        let lastOutput = { stdout: '', stderr: '', exitCode: 0, compilationError: null as string | null };

        for (const tc of testCases) {
            const result = await executeJudge0(
                config,
                lang.id,
                code,
                tc.input,
            );

            const stdout = b64Decode(result.stdout);
            const stderr = b64Decode(result.stderr);
            const compileOutput = b64Decode(result.compile_output);
            const isCompileError = result.status.id === 6;

            const actualOutput = stdout.trim();
            const expectedOutput = tc.expectedOutput.trim();
            const passed = actualOutput === expectedOutput && !isCompileError;

            lastOutput = {
                stdout,
                stderr: isCompileError ? compileOutput : stderr,
                exitCode: result.status.id === 3 ? 0 : 1,
                compilationError: isCompileError ? compileOutput : null,
            };

            testResults.push({
                name: tc.name,
                passed,
                expected: tc.isHidden ? '[hidden]' : expectedOutput,
                actual: tc.isHidden ? '[hidden]' : actualOutput,
                isHidden: tc.isHidden,
            });

            // If compilation failed, all subsequent tests will fail the same way
            if (isCompileError) {
                for (const remaining of testCases.slice(testCases.indexOf(tc) + 1)) {
                    testResults.push({
                        name: remaining.name,
                        passed: false,
                        expected: remaining.isHidden ? '[hidden]' : remaining.expectedOutput.trim(),
                        actual: remaining.isHidden ? '[hidden]' : 'Compilation failed',
                        isHidden: remaining.isHidden,
                    });
                }
                break;
            }
        }

        return NextResponse.json({
            success: true,
            output: lastOutput,
            testResults,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Code execution failed:', message);

        if (message.includes('timed out') || message.includes('AbortError')) {
            return NextResponse.json(
                { error: 'Code execution timed out' },
                { status: 408 }
            );
        }

        return NextResponse.json(
            { error: 'Code execution failed', details: message },
            { status: 500 }
        );
    }
}

/**
 * Execute code via Judge0 CE API.
 *
 * Uses synchronous mode (?wait=true) so we get the result immediately.
 * All payloads are base64-encoded (?base64_encoded=true).
 */
async function executeJudge0(
    config: { apiUrl: string; authToken: string; timeoutMs: number },
    languageId: number,
    code: string,
    stdin: string,
): Promise<Judge0Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs + 5000);

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (config.authToken) {
            headers['X-Auth-Token'] = config.authToken;
        }

        const response = await fetch(
            `${config.apiUrl}/submissions?base64_encoded=true&wait=true`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    language_id: languageId,
                    source_code: b64Encode(code),
                    stdin: b64Encode(stdin),
                    cpu_time_limit: config.timeoutMs / 1000,
                    wall_time_limit: (config.timeoutMs / 1000) * 2,
                }),
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Judge0 API error (${response.status}): ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Code execution timed out');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}
