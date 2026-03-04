"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestCase {
    id: string;
    name: string;
    input?: string;
    expectedOutput?: string;
    passed: boolean | null;
}

export interface SandboxResult {
    success: boolean;
    output: string[];
    error: string | null;
    testResults: { id: string; passed: boolean; actualOutput?: string; error?: string }[];
}

// ─── Solana SDK Mocks ─────────────────────────────────────────────────────────
// Provides lightweight mocks so user code with `import { ... } from "@solana/web3.js"`
// can execute in a plain JS environment without the real SDK.

const SOLANA_MOCKS = `
class PublicKey {
    constructor(key) {
        if (key instanceof PublicKey) { this._key = key._key; return; }
        this._key = typeof key === 'string' ? key : (key instanceof Uint8Array ? Array.from(key).map(b => b.toString(16).padStart(2,'0')).join('') : 'mock-pubkey');
    }
    toBase58() { return this._key; }
    toString() { return this._key; }
    toBuffer() { return new Uint8Array(32); }
    toBytes() { return new Uint8Array(32); }
    equals(other) { return this._key === (other && other._key); }
    static unique() { return new PublicKey('gen-' + Math.random().toString(36).slice(2)); }
}
PublicKey.default = new PublicKey('11111111111111111111111111111112');

class TransactionInstruction {
    constructor(opts) {
        this.programId = opts.programId;
        this.keys = opts.keys || [];
        this.data = opts.data || new Uint8Array(0);
    }
}

class Transaction {
    constructor() { this.instructions = []; this.feePayer = null; this.recentBlockhash = null; }
    add(...items) { this.instructions.push(...items); return this; }
}

const SystemProgram = {
    programId: new PublicKey('11111111111111111111111111111111'),
    transfer: function(params) {
        return new TransactionInstruction({
            programId: SystemProgram.programId,
            keys: [
                { pubkey: params.fromPubkey, isSigner: true, isWritable: true },
                { pubkey: params.toPubkey, isSigner: false, isWritable: true },
            ],
            data: new Uint8Array(0),
        });
    },
    createAccount: function(params) {
        return new TransactionInstruction({
            programId: SystemProgram.programId,
            keys: [
                { pubkey: params.fromPubkey, isSigner: true, isWritable: true },
                { pubkey: params.newAccountPubkey, isSigner: true, isWritable: true },
            ],
            data: new Uint8Array(0),
        });
    },
};

class Connection {
    constructor(endpoint) { this.endpoint = endpoint || 'https://api.devnet.solana.com'; }
    async getBalance() { return 1000000000; }
    async getLatestBlockhash() { return { blockhash: 'mock-blockhash', lastValidBlockHeight: 100 }; }
    async confirmTransaction() { return { value: { err: null } }; }
    async sendTransaction() { return 'mock-tx-sig-' + Math.random().toString(36).slice(2); }
    async getAccountInfo() { return { data: new Uint8Array(0), lamports: 1000000, owner: SystemProgram.programId }; }
}

const Keypair = {
    generate: function() {
        return { publicKey: new PublicKey('generated-' + Math.random().toString(36).slice(2)), secretKey: new Uint8Array(64) };
    },
    fromSecretKey: function(sk) {
        return { publicKey: new PublicKey('from-secret'), secretKey: sk };
    },
};

const LAMPORTS_PER_SOL = 1000000000;

const clusterApiUrl = function(cluster) { return 'https://api.' + (cluster || 'devnet') + '.solana.com'; };

const sendAndConfirmTransaction = async function(connection, transaction, signers) {
    return 'mock-tx-sig-' + Math.random().toString(36).slice(2);
};
`;

/**
 * Basic linting for common beginner mistakes
 */
export function lintCode(code: string): string | null {
    // Check for unbalanced braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) return "SYNTAX ERROR: Unbalanced curly de-shackles detected (braces).";

    // Check for empty code
    if (code.trim().length < 5) return "SYSTEM ERROR: Null sequence detected. Code too short for execution.";

    return null;
}

// ─── TypeScript → JavaScript Transform ────────────────────────────────────────
// Handles the common TS patterns found in Solana learning challenges.

function transformToExecutableJS(code: string): string {
    let result = code;

    // Transform `import { X, Y } from "@solana/web3.js"` → `const { X, Y } = __solana_web3;`
    result = result.replace(
        /import\s*\{([^}]+)\}\s*from\s*["']@solana\/web3\.js["'];?/g,
        (_, imports) => {
            const cleaned = imports.replace(/\s+/g, ' ').trim();
            return `const { ${cleaned} } = __solana_web3;`;
        }
    );

    // Remove other import statements (we don't have those modules)
    result = result.replace(/import\s+.*?from\s+["'][^"']+["'];?\n?/g, '');
    result = result.replace(/import\s+["'][^"']+["'];?\n?/g, '');

    // Strip TypeScript type annotations from function parameters: (x: Type) → (x)
    // Handle simple types
    result = result.replace(/:\s*(?:string|number|boolean|any|void|never|undefined|null|bigint|object)\s*([,)=\n])/g, '$1');
    // Handle named types (e.g., PublicKey, Keypair, etc.)
    result = result.replace(/:\s*[A-Z][a-zA-Z0-9]*(?:<[^>]+>)?\s*([,)=\n])/g, '$1');
    // Handle array types
    result = result.replace(/:\s*(?:[a-zA-Z]+(?:<[^>]+>)?\[\])\s*([,)=\n])/g, '$1');

    // Strip return type annotations: ): Type => or ): Type {
    result = result.replace(/\)\s*:\s*[A-Za-z][A-Za-z0-9]*(?:<[^>]+>)?\s*([\{=>])/g, ') $1');

    // Remove interface/type declarations
    result = result.replace(/(?:export\s+)?interface\s+\w+(?:<[^>]+>)?\s*\{[^}]*\}/g, '');
    result = result.replace(/(?:export\s+)?type\s+\w+\s*=\s*[^;\n]+;/g, '');

    // Remove `export` keyword from function/const declarations
    result = result.replace(/^export\s+(function|const|let|var|class|async)/gm, '$1');

    return result;
}

// ─── Sandbox Executor ─────────────────────────────────────────────────────────
// Creates a sandboxed iframe with blob URL, executes user code + test cases,
// and communicates results via postMessage.

export function executeInSandbox(
    userCode: string,
    testCases: TestCase[],
    timeoutMs: number = 10000
): Promise<SandboxResult> {
    return new Promise((resolve) => {
        const transformedCode = transformToExecutableJS(userCode);

        // Build test runner code
        const testRunnerCode = testCases.map((tc, i) => {
            if (tc.input && tc.expectedOutput) {
                return `
                    try {
                        const __testInput = ${JSON.stringify(tc.input)};
                        const __expectedOutput = ${JSON.stringify(tc.expectedOutput)};
                        // Try evaluating the input as a function call
                        const __result = eval(__testInput);
                        const __resultStr = (typeof __result === 'object' && __result !== null) ? JSON.stringify(__result) : String(__result);
                        
                        const __passed = __resultStr.trim() === __expectedOutput.trim() || __result == __expectedOutput;
                        
                        __testResults.push({ 
                            id: ${JSON.stringify(tc.id)}, 
                            passed: __passed,
                            actualOutput: __resultStr,
                            error: __passed ? null : ('Expected: "' + __expectedOutput + '", Got: "' + __resultStr + '"')
                        });
                    } catch(e) {
                        __testResults.push({ id: ${JSON.stringify(tc.id)}, passed: false, error: e.message });
                    }
                `;
            }
            // If no input/expectedOutput, just mark as passed if code compiled
            return `__testResults.push({ id: ${JSON.stringify(tc.id)}, passed: __codeRan });`;
        }).join('\n');

        const sandboxHTML = `
            <!DOCTYPE html>
            <html>
            <head><title>Sandbox</title></head>
            <body>
            <script>
                // Mocks
                const __solana_web3 = (function() {
                    ${SOLANA_MOCKS}
                    return {
                        PublicKey, TransactionInstruction, Transaction,
                        SystemProgram, Connection, Keypair,
                        LAMPORTS_PER_SOL, clusterApiUrl, sendAndConfirmTransaction,
                    };
                })();

                // Capture console output
                const __logs = [];
                const __origConsole = { log: console.log, error: console.error, warn: console.warn };
                console.log = function() { __logs.push([...arguments].map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); };
                console.error = console.log;
                console.warn = console.log;

                let __codeRan = false;
                let __codeError = null;
                const __testResults = [];

                try {
                    // Execute user code
                    ${transformedCode}
                    __codeRan = true;

                    // Run test cases if code compiled
                    ${testRunnerCode}
                } catch(e) {
                    __codeError = e.message || String(e);
                    if (!__codeRan) {
                        __logs.push('Error: ' + __codeError);
                        // All tests fail if code didn't compile
                        ${testCases.map(tc => `__testResults.push({ id: ${JSON.stringify(tc.id)}, passed: false, error: __codeError || 'Code failed to execute' });`).join('\n')}
                    } else {
                        __logs.push('Test runner error: ' + __codeError);
                    }
                }

                // Send results back
                parent.postMessage({
                    type: '__sandbox_result__',
                    success: __codeRan,
                    output: __logs,
                    error: __codeError,
                    testResults: __testResults,
                }, '*');
            <\/script>
            </body>
            </html>
        `;

        const blob = new Blob([sandboxHTML], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.sandbox.add('allow-scripts');
        iframe.src = blobUrl;

        let settled = false;

        const cleanup = () => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
            URL.revokeObjectURL(blobUrl);
            window.removeEventListener('message', handleMessage);
        };

        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === '__sandbox_result__') {
                settled = true;
                cleanup();
                resolve({
                    success: event.data.success,
                    output: event.data.output || [],
                    error: event.data.error,
                    testResults: event.data.testResults || [],
                });
            }
        };

        window.addEventListener('message', handleMessage);
        document.body.appendChild(iframe);

        // Timeout fallback
        setTimeout(() => {
            if (!settled) {
                settled = true;
                cleanup();
                resolve({
                    success: false,
                    output: ['Execution timed out after ' + (timeoutMs / 1000) + 's'],
                    error: 'Execution timed out',
                    testResults: testCases.map(tc => ({
                        id: tc.id,
                        passed: false,
                        error: 'Timed out',
                    })),
                });
            }
        }, timeoutMs);
    });
}
