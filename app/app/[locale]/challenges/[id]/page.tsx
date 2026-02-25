'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Play, Send, CheckCircle, XCircle, Zap, Lightbulb, RotateCcw,
  Trophy, Eye, ChevronDown, ChevronUp, Code2
} from 'lucide-react';
import { clsx } from 'clsx';

const cn = (...args: Parameters<typeof clsx>) => clsx(args);

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-900 text-gray-500 text-sm">
      Carregando editor...
    </div>
  ),
});

const CHALLENGES: Record<string, {
  id: string; title: string; difficulty: string; xp: number;
  description: string; examples: { input: string; output: string; explanation: string }[];
  starterCode: string; hints: string[];
  testCases: { name: string; input: string; expected: string }[];
  solution: string;
}> = {
  'transfer-sol': {
    id: 'transfer-sol',
    title: 'Transfer SOL Between Wallets',
    difficulty: 'Iniciante',
    xp: 200,
    description: `## Transferir SOL Entre Carteiras

Implemente a função \`transferSOL\` que transfere uma quantidade de SOL de uma carteira para outra na rede Solana.

### Requisitos

1. A função deve aceitar: \`connection\`, \`sender\` (Keypair), \`recipient\` (PublicKey), e \`amountSOL\` (number)
2. Converta SOL para lamports (1 SOL = 1,000,000,000 lamports)
3. Crie e envie a transação usando \`SystemProgram.transfer\`
4. Retorne a assinatura da transação
5. Trate erros de saldo insuficiente

### Constraints

- \`0.001 ≤ amountSOL ≤ 100\`
- O sender deve ter saldo suficiente
- Retorne a string da assinatura em caso de sucesso
`,
    examples: [
      {
        input: 'sender = keypair, recipient = pubkey, amountSOL = 0.1',
        output: '"5UfgJ4..." (transaction signature)',
        explanation: 'Transfere 0.1 SOL, equivalente a 100,000,000 lamports',
      },
    ],
    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

/**
 * Transfere SOL de uma carteira para outra
 * @returns Assinatura da transação
 */
export async function transferSOL(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  amountSOL: number
): Promise<string> {
  // TODO: Converta amountSOL para lamports
  const lamports = /* seu código aqui */ 0;

  // TODO: Crie a instrução de transferência
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: /* ? */,
    toPubkey: /* ? */,
    lamports: /* ? */,
  });

  // TODO: Crie e envie a transação
  const transaction = new Transaction().add(transferInstruction);

  // TODO: Retorne a assinatura
  return "";
}
`,
    hints: [
      '1 SOL = LAMPORTS_PER_SOL (1,000,000,000 lamports). Multiplique amountSOL por LAMPORTS_PER_SOL.',
      'Use sender.publicKey para o campo fromPubkey e recipient para toPubkey.',
      'Após criar a transaction, use sendAndConfirmTransaction(connection, transaction, [sender]) para enviar.',
    ],
    testCases: [
      { name: 'Transferência básica de 0.001 SOL', input: 'amountSOL = 0.001', expected: 'string signature (5UfgJ4...)' },
      { name: 'Conversão correta para lamports', input: 'amountSOL = 1.5', expected: 'lamports = 1500000000' },
      { name: 'Rejeita saldo insuficiente', input: 'balance = 0, amountSOL = 1', expected: 'throws InsufficientFundsError' },
    ],
    solution: `export async function transferSOL(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  amountSOL: number
): Promise<string> {
  const lamports = amountSOL * LAMPORTS_PER_SOL;

  const transferInstruction = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient,
    lamports,
  });

  const transaction = new Transaction().add(transferInstruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [sender]);
  return signature;
}`,
  },
  'create-token': {
    id: 'create-token',
    title: 'Criar Token SPL',
    difficulty: 'Intermediário',
    xp: 350,
    description: `## Criar um Token SPL

Implemente a função \`createSPLToken\` que cria um novo token SPL na Solana.

### Requisitos

1. Crie um novo mint account
2. Configure decimals e authorities
3. Retorne o endereço do mint
`,
    examples: [
      { input: 'payer = keypair, decimals = 6', output: 'mintPublicKey (string)', explanation: 'Cria um token com 6 casas decimais' },
    ],
    starterCode: `import { createMint } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export async function createSPLToken(
  connection: Connection,
  payer: Keypair,
  decimals: number = 6
): Promise<PublicKey> {
  // TODO: Use createMint do @solana/spl-token
  // createMint(connection, payer, mintAuthority, freezeAuthority, decimals)

  return new PublicKey("11111111111111111111111111111111");
}
`,
    hints: [
      'Import createMint from "@solana/spl-token".',
      'Use payer.publicKey como mintAuthority. freezeAuthority pode ser null.',
    ],
    testCases: [
      { name: 'Cria mint com 6 decimals', input: 'decimals = 6', expected: 'PublicKey válida' },
      { name: 'Cria mint com 0 decimals (NFT-like)', input: 'decimals = 0', expected: 'PublicKey válida' },
      { name: 'Mint authority configurada corretamente', input: 'payer = keypair', expected: 'mintAuthority === payer.publicKey' },
    ],
    solution: `export async function createSPLToken(...) { /* solution */ }`,
  },
};

const DEFAULT_CHALLENGE = CHALLENGES['transfer-sol'];

const DIFF_COLORS: Record<string, string> = {
  Iniciante: 'bg-green-900/50 text-green-300 border border-green-700/50',
  Intermediário: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
  Avançado: 'bg-red-900/50 text-red-300 border border-red-700/50',
};

type TestResult = 'pending' | 'pass' | 'fail' | 'running';

export default function ChallengePage() {
  const params = useParams();
  const challengeId = (params.id as string) || 'transfer-sol';
  const challenge = CHALLENGES[challengeId] ?? DEFAULT_CHALLENGE;

  const [code, setCode] = useState(challenge.starterCode);
  const [testResults, setTestResults] = useState<TestResult[]>(challenge.testCases.map(() => 'pending'));
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(true);

  const runTests = async () => {
    setRunning(true);
    setTestResults(challenge.testCases.map(() => 'running'));
    await new Promise((r) => setTimeout(r, 800));
    // Simulate: all pass after a delay
    const results: TestResult[] = challenge.testCases.map((_, i) => {
      // Mock: first 2 pass, check code length to determine 3rd
      if (i < 2) return 'pass';
      return code.includes('lamports') && code.includes('sendAndConfirmTransaction') ? 'pass' : 'fail';
    });
    setTestResults(results);
    setRunning(false);
  };

  const submitSolution = async () => {
    await runTests();
    setSubmitted(true);
  };

  const resetCode = () => {
    setCode(challenge.starterCode);
    setTestResults(challenge.testCases.map(() => 'pending'));
    setSubmitted(false);
  };

  const passing = testResults.filter((r) => r === 'pass').length;
  const allPassing = passing === challenge.testCases.length;

  const testIcon = (result: TestResult) => {
    if (result === 'running') return <div className="h-4 w-4 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />;
    if (result === 'pass') return <CheckCircle className="h-4 w-4 text-green-400" />;
    if (result === 'fail') return <XCircle className="h-4 w-4 text-red-400" />;
    return <div className="h-4 w-4 rounded-full border border-gray-600" />;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-950 text-gray-100 overflow-hidden">
      {/* Left: description */}
      <div className="flex w-[42%] flex-col border-r border-gray-800 overflow-y-auto shrink-0">
        <div className="border-b border-gray-800 bg-gray-900/60 px-5 py-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', DIFF_COLORS[challenge.difficulty])}>
              {challenge.difficulty}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-yellow-900/40 border border-yellow-700/40 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
              <Zap className="h-3 w-3" />
              +{challenge.xp} XP
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">{challenge.title}</h1>
        </div>

        <div className="flex-1 p-5 space-y-6">
          {/* Description */}
          <div className="text-sm text-gray-300 leading-relaxed space-y-3">
            {challenge.description.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold text-white">{line.slice(3)}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-purple-300">{line.slice(4)}</h3>;
              if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ') || line.startsWith('5. ')) {
                return <li key={i} className="ml-4 list-decimal text-sm text-gray-300">{line.slice(3)}</li>;
              }
              if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-sm text-gray-400">{line.slice(2)}</li>;
              if (line.trim() === '') return <div key={i} className="h-1" />;
              const parts = line.split(/`(.*?)`/g);
              if (parts.length > 1) {
                return (
                  <p key={i} className="text-sm text-gray-300">
                    {parts.map((p, j) =>
                      j % 2 === 0 ? p : <code key={j} className="rounded bg-gray-800 px-1 py-0.5 text-xs font-mono text-purple-300">{p}</code>
                    )}
                  </p>
                );
              }
              return <p key={i} className="text-sm text-gray-300">{line}</p>;
            })}
          </div>

          {/* Examples */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Exemplos</h3>
            {challenge.examples.map((ex, i) => (
              <div key={i} className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden mb-3">
                <div className="grid grid-cols-2 divide-x divide-gray-700">
                  <div className="p-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Input</div>
                    <code className="text-xs text-green-300 font-mono">{ex.input}</code>
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Output</div>
                    <code className="text-xs text-blue-300 font-mono">{ex.output}</code>
                  </div>
                </div>
                {ex.explanation && (
                  <div className="border-t border-gray-700 p-3">
                    <span className="text-xs text-gray-500 font-medium">Explicação: </span>
                    <span className="text-xs text-gray-400">{ex.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hints */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                Dicas ({hintsShown}/{challenge.hints.length})
              </h3>
              {hintsShown < challenge.hints.length && (
                <button
                  onClick={() => setHintsShown((n) => n + 1)}
                  className="text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-700/50 rounded-lg px-2 py-1 hover:bg-yellow-900/20 transition-all"
                >
                  Revelar dica
                </button>
              )}
            </div>
            {hintsShown === 0 && (
              <p className="text-xs text-gray-500">Tente resolver sozinho primeiro!</p>
            )}
            {challenge.hints.slice(0, hintsShown).map((hint, i) => (
              <div key={i} className="mb-2 rounded-lg border border-yellow-800/40 bg-yellow-900/10 p-3">
                <p className="text-xs text-yellow-200">{hint}</p>
              </div>
            ))}
          </div>

          {/* Solution reveal */}
          {submitted && allPassing && (
            <div>
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
              >
                <Eye className="h-3.5 w-3.5" />
                {showSolution ? 'Ocultar' : 'Ver'} solução de referência
              </button>
              {showSolution && (
                <pre className="mt-2 rounded-xl bg-gray-900 border border-gray-700 p-4 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {challenge.solution}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Editor + test panel */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Editor toolbar */}
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-400 font-medium">TypeScript</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetCode}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              onClick={runTests}
              disabled={running}
              className="flex items-center gap-1.5 rounded-lg border border-green-700 bg-green-900/30 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-900/50 transition-all disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {running ? 'Executando...' : 'Executar Testes'}
            </button>
            <button
              onClick={submitSolution}
              disabled={running}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar Solução
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0">
          <MonacoEditor
            height="100%"
            defaultLanguage="typescript"
            value={code}
            onChange={(v) => setCode(v ?? '')}
            theme="vs-dark"
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
              fontFamily: '"Geist Mono", "Fira Code", monospace',
              fontLigatures: true,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Test cases panel */}
        <div className={cn(
          'shrink-0 border-t border-gray-800 bg-gray-900/80 transition-all',
          showTestPanel ? 'max-h-48' : 'max-h-10'
        )}>
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-400 hover:text-gray-200"
          >
            <div className="flex items-center gap-2">
              <span>Casos de Teste</span>
              {testResults.some((r) => r !== 'pending') && (
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-bold',
                  allPassing ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                )}>
                  {passing}/{challenge.testCases.length} passando
                </span>
              )}
            </div>
            {showTestPanel ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>

          {showTestPanel && (
            <div className="overflow-y-auto px-4 pb-3 space-y-2">
              {challenge.testCases.map((tc, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-xs border transition-all',
                    testResults[i] === 'pass' ? 'border-green-800/50 bg-green-900/10' :
                    testResults[i] === 'fail' ? 'border-red-800/50 bg-red-900/10' :
                    'border-gray-700 bg-gray-800/40'
                  )}
                >
                  {testIcon(testResults[i])}
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'font-medium',
                      testResults[i] === 'pass' ? 'text-green-300' :
                      testResults[i] === 'fail' ? 'text-red-300' : 'text-gray-300'
                    )}>
                      {tc.name}
                    </span>
                    <div className="text-gray-500 mt-0.5 truncate">
                      Input: <span className="text-gray-400">{tc.input}</span>
                      {' → '}Expected: <span className="text-gray-400">{tc.expected}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Success overlay */}
      {submitted && allPassing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50" onClick={() => setSubmitted(false)}>
          <div className="rounded-3xl border border-yellow-700/50 bg-gray-900 p-8 text-center max-w-sm mx-4 shadow-2xl">
            <div className="mb-4 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                <Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-extrabold text-white">Desafio Concluído!</h2>
            <p className="mb-4 text-gray-400 text-sm">Todos os {challenge.testCases.length} testes passando. Excelente trabalho!</p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Zap className="h-6 w-6 text-yellow-400" />
              <span className="text-3xl font-extrabold text-yellow-300">+{challenge.xp} XP</span>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white hover:from-purple-500 hover:to-indigo-500 transition-all"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
