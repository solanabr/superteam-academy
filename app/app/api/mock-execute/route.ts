/**
 * POST /api/mock-execute
 *
 * Mock code execution endpoint — simulates Judge0 behaviour.
 * Compares user code against expected solution patterns.
 * Only available when NEXT_PUBLIC_USE_MOCK_DATA=true.
 */
import { NextRequest, NextResponse } from 'next/server';

interface TestCase {
    name: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

interface TestResult {
    name: string;
    passed: boolean;
    output: string;
    expected: string;
    isHidden: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true') {
        return NextResponse.json({ error: 'Mock execution not enabled' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { code, language, testCases } = body as {
            code: string;
            language: string;
            testCases: TestCase[];
        };

        if (!code || !testCases) {
            return NextResponse.json({ error: 'code and testCases required' }, { status: 400 });
        }

        // Simulate execution delay (1-2 seconds)
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

        // Simple pattern matching to determine if code is correct
        const results: TestResult[] = testCases.map((tc) => {
            const passed = checkCodeSolution(code, language, tc);
            return {
                name: tc.name,
                passed,
                output: passed ? tc.expectedOutput : getIncorrectOutput(code, language),
                expected: tc.expectedOutput,
                isHidden: tc.isHidden,
            };
        });

        const allPassed = results.every((r) => r.passed);

        return NextResponse.json({
            results,
            allPassed,
            executionTime: `${(1 + Math.random()).toFixed(2)}s`,
            language,
        });
    } catch (error) {
        console.error('[MockExecute] Error:', error);
        return NextResponse.json({ error: 'Execution failed' }, { status: 500 });
    }
}

/**
 * Check if user code contains the solution pattern.
 * This is intentionally simple — matches key patterns rather than executing code.
 */
function checkCodeSolution(code: string, language: string, tc: TestCase): boolean {
    const normalized = code.replace(/\s+/g, ' ').trim();

    if (language === 'rust') {
        // Check for Hello Solana challenge
        if (tc.expectedOutput === 'Hello, Solana!') {
            return (
                (normalized.includes('Hello, Solana!') &&
                    (normalized.includes('String::from') || normalized.includes('.to_string()') || normalized.includes('format!'))) &&
                normalized.includes('fn hello_solana') &&
                !normalized.includes('todo!()')
            );
        }
    }

    if (language === 'typescript') {
        // Check for Token Swap calculator
        if (tc.expectedOutput === '181' || tc.expectedOutput === '9' || tc.expectedOutput === '6644' || tc.expectedOutput === '0') {
            return (
                normalized.includes('Math.floor') &&
                (normalized.includes('0.997') || normalized.includes('1 - fee') || normalized.includes('1 - 0.003')) &&
                normalized.includes('outputReserve') &&
                normalized.includes('inputReserve') &&
                !normalized.includes('return 0;')
            );
        }
    }

    return false;
}

/**
 * Generate a plausible "incorrect" output for display.
 */
function getIncorrectOutput(code: string, language: string): string {
    if (code.includes('todo!()')) return 'Error: not yet implemented';
    if (code.includes('return 0')) return '0';
    if (language === 'rust') return 'Error: compilation failed';
    return 'undefined';
}
