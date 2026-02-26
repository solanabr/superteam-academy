'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle, Circle, Zap, Code2,
  BookOpen, ArrowLeft, Play, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { localePath } from '@/lib/paths';

const L = (obj: Record<string, string>, locale: string) => obj[locale] ?? obj['pt-BR'];

function EditorLoadingFallback() {
  const tLesson = useTranslations('lesson');
  return (
    <div className="flex h-full items-center justify-center bg-gray-900 text-gray-500 text-sm">
      {tLesson('loading_editor')}
    </div>
  );
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorLoadingFallback />,
});

const COURSE_TITLE: Record<string, string> = {
  'pt-BR': 'Introdução ao Solana',
  'en': 'Introduction to Solana',
  'es': 'Introducción a Solana',
};

const LESSONS = [
  {
    id: 'intro-1',
    title: {
      'pt-BR': 'O que é Solana? Arquitetura e Proof of History',
      'en': 'What is Solana? Architecture and Proof of History',
      'es': '¿Qué es Solana? Arquitectura y Proof of History',
    },
    course: COURSE_TITLE,
    xp: 100,
    duration: 25,
    completed: true,
    content: `# O que é Solana?

Solana é uma blockchain de alta performance capaz de processar **65,000 transações por segundo** com tempo de finalização de menos de 400ms e taxas mínimas (~0.000005 SOL por transação).

## Proof of History (PoH)

O grande diferencial da Solana é o **Proof of History** — um relógio criptográfico que permite aos validadores chegar a um consenso sobre a ordem dos eventos sem precisar se comunicar entre si.

\`\`\`
Bloco N → Hash(Bloco N) → Hash(Hash(N)) → Bloco N+1
\`\`\`

Isso cria uma sequência verificável de eventos que serve como uma "marcação de tempo" distribuída.

## Arquitetura

- **Validators**: Processam transações e produzem blocos
- **Leaders**: Escolhidos via VRF para produzir blocos em slots de 400ms
- **Tower BFT**: Variante do PBFT otimizada para PoH
- **Turbine**: Propagação de blocos em blocos menores (shreds)
- **Gulf Stream**: Encaminhamento de transações sem mempool
- **Sealevel**: Execução paralela de contratos

## Contas no modelo Solana

Diferente do Ethereum, Solana separa **código** (programas) de **dados** (contas). Um programa não armazena estado — o estado fica em contas separadas que o programa pode ler/escrever.

\`\`\`typescript
// Estrutura básica de uma conta Solana
interface Account {
  lamports: number;      // Saldo em lamports (1 SOL = 1e9 lamports)
  owner: PublicKey;      // Programa dono da conta
  executable: boolean;   // É um programa?
  data: Buffer;          // Dados arbitrários
}
\`\`\`
`,
    starterCode: `import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Conectando ao devnet
const connection = new Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

async function main() {
  // TODO: Crie um novo Keypair
  // const keypair = ...

  // TODO: Consulte o saldo de uma conta
  // const balance = await connection.getBalance(keypair.publicKey);
  // console.log(\`Saldo: \${balance / LAMPORTS_PER_SOL} SOL\`);

  // TODO: Faça um airdrop de 1 SOL para testar
  // const sig = await connection.requestAirdrop(...);

  console.log("Olá, Solana!");
}

main().catch(console.error);
`,
  },
  {
    id: 'intro-2',
    title: {
      'pt-BR': 'Contas, Lamports e o modelo de dados',
      'en': 'Accounts, Lamports, and the data model',
      'es': 'Cuentas, Lamports y el modelo de datos',
    },
    course: COURSE_TITLE,
    xp: 100,
    duration: 30,
    completed: true,
    content: `# Contas e Lamports

No modelo Solana, tudo é uma **conta**. Programas, tokens, NFTs, e dados de usuário — tudo vive em contas.

## Lamports

1 SOL = **1,000,000,000 lamports**. As taxas são cobradas em lamports.

## Rent

Contas precisam manter um saldo mínimo para cobrir o "aluguel" do espaço de armazenamento.`,
    starterCode: `import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

async function explorarContas() {
  const keypair = Keypair.generate();
  console.log("Pubkey:", keypair.publicKey.toBase58());

  // Verificar informações de uma conta
  const accountInfo = await connection.getAccountInfo(keypair.publicKey);
  console.log("Account info:", accountInfo);

  // Calcular rent mínimo para 100 bytes de dados
  const rentExempt = await connection.getMinimumBalanceForRentExemption(100);
  console.log(\`Rent exempt para 100 bytes: \${rentExempt / LAMPORTS_PER_SOL} SOL\`);
}

explorarContas();
`,
  },
  {
    id: 'intro-3',
    title: {
      'pt-BR': 'Configurando o ambiente: Solana CLI + Phantom',
      'en': 'Setting up the environment: Solana CLI + Phantom',
      'es': 'Configurando el entorno: Solana CLI + Phantom',
    },
    course: COURSE_TITLE,
    xp: 100,
    duration: 20,
    completed: false,
    content: `# Configurando seu Ambiente

## Solana CLI

\`\`\`bash
# Instalar Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Verificar instalação
solana --version

# Configurar para devnet
solana config set --url devnet

# Criar novo keypair
solana-keygen new

# Solicitar SOL de devnet
solana airdrop 2
\`\`\``,
    starterCode: `// Gerenciando keypairs com @solana/web3.js
import { Keypair } from "@solana/web3.js";
import * as fs from "fs";

// Gerar novo keypair
const keypair = Keypair.generate();
console.log("Chave pública:", keypair.publicKey.toBase58());

// Salvar keypair (NUNCA compartilhe sua chave privada!)
const keyData = JSON.stringify(Array.from(keypair.secretKey));
// fs.writeFileSync("minha-carteira.json", keyData);

// Carregar keypair existente
// const loaded = Keypair.fromSecretKey(
//   Buffer.from(JSON.parse(fs.readFileSync("minha-carteira.json", "utf-8")))
// );
`,
  },
];

const LESSON_SIDEBAR = LESSONS;

type TabType = 'content' | 'editor';

export default function LessonPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('lesson');
  const tCommon = useTranslations('common');
  const lessonId = (params.id as string) || 'intro-1';

  const currentIndex = LESSON_SIDEBAR.findIndex((l) => l.id === lessonId);
  const lesson = LESSON_SIDEBAR[currentIndex] ?? LESSON_SIDEBAR[0];
  const prevLesson = LESSON_SIDEBAR[currentIndex - 1];
  const nextLesson = LESSON_SIDEBAR[currentIndex + 1];

  const [code, setCode] = useState(lesson.starterCode);
  const [completed, setCompleted] = useState(lesson.completed);
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [language, setLanguage] = useState('typescript');
  const [completing, setCompleting] = useState(false);
  const { publicKey } = useWallet();

  const handleComplete = useCallback(async () => {
    if (completed || completing) return;
    setCompleting(true);

    // If wallet is connected, persist completion on-chain via API
    if (publicKey) {
      try {
        const res = await fetch('/api/complete-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: 'intro-solana',
            lessonIndex: currentIndex,
            learner: publicKey.toBase58(),
          }),
        });
        if (!res.ok) {
          console.error('Lesson completion API error:', await res.text());
        }
      } catch (err) {
        console.error('Failed to persist lesson completion:', err);
      }
    }

    setCompleted(true);
    setCompleting(false);
  }, [completed, completing, publicKey, currentIndex]);

  const completedCount = LESSON_SIDEBAR.filter((l) => l.completed).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div data-testid="lesson-sidebar" className="hidden lg:flex w-72 flex-col border-r border-gray-800 bg-gray-900/60 overflow-y-auto shrink-0">
        <div className="p-4 border-b border-gray-800">
          <Link
            href={localePath(locale, '/courses/intro-solana')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {L(COURSE_TITLE, locale)}
          </Link>
          <h3 className="text-sm font-semibold text-white">{t('course_lessons')}</h3>
          <div className="mt-1 text-xs text-gray-500">
            {completedCount}/{LESSON_SIDEBAR.length} {t('completed_count')}
          </div>
        </div>
        <div className="flex-1 p-2">
          {LESSON_SIDEBAR.map((l, i) => (
            <Link
              key={l.id}
              href={localePath(locale, `/lessons/${l.id}`)}
              className={cn(
                'flex items-start gap-2.5 rounded-lg px-3 py-2.5 mb-0.5 text-xs transition-all',
                l.id === lesson.id
                  ? 'bg-purple-900/40 border border-purple-700/50 text-purple-200'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {l.completed ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Circle className={cn('h-3.5 w-3.5', l.id === lesson.id ? 'text-purple-400' : 'text-gray-600')} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className={cn('block leading-snug', l.id === lesson.id ? 'font-medium' : '')}>
                  {i + 1}. {L(l.title, locale)}
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-gray-600">
                  <span>{l.duration}min</span>
                  <span className="text-yellow-500/70">+{l.xp} XP</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar with tabs */}
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('content')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                activeTab === 'content'
                  ? 'bg-purple-900/50 text-purple-300'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              {t('content_tab')}
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                activeTab === 'editor'
                  ? 'bg-purple-900/50 text-purple-300'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              {t('editor_tab')}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{lesson.duration}min</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
              <Zap className="h-3.5 w-3.5" />
              +{lesson.xp} XP
            </div>
          </div>
        </div>

        {/* Content split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: lesson content (always visible on desktop, tabbed on mobile) */}
          <div className={cn(
            'flex flex-col border-r border-gray-800 overflow-y-auto',
            'w-full lg:w-3/5',
            activeTab === 'editor' ? 'hidden lg:flex' : 'flex'
          )}>
            <div className="p-6 flex-1">
              <h1 className="mb-1 text-xl font-bold text-white leading-tight">{L(lesson.title, locale)}</h1>
              <p className="mb-6 text-xs text-gray-500">{L(lesson.course, locale)}</p>

              {/* Render markdown-ish content */}
              <div className="prose-lesson space-y-4">
                {lesson.content.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mb-2">{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-purple-300 mt-6 mb-2">{line.slice(3)}</h2>;
                  if (line.startsWith('```')) return null;
                  if (line.startsWith('- ')) return <li key={i} className="ml-4 text-sm text-gray-300 list-disc">{line.slice(2)}</li>;
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  // Bold text
                  const parts = line.split(/\*\*(.*?)\*\*/g);
                  if (parts.length > 1) {
                    return (
                      <p key={i} className="text-sm text-gray-300 leading-relaxed">
                        {parts.map((p, j) => j % 2 === 0 ? p : <strong key={j} className="text-white">{p}</strong>)}
                      </p>
                    );
                  }
                  return <p key={i} className="text-sm text-gray-300 leading-relaxed">{line}</p>;
                })}
              </div>

              {/* Code block example */}
              <div className="mt-6 rounded-xl overflow-hidden border border-gray-700">
                <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/70" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">typescript</span>
                </div>
                <div className="bg-gray-900 p-4">
                  <pre className="text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {`import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const pubkey = new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");

const balance = await connection.getBalance(pubkey);
console.log(\`Saldo: \${balance / 1e9} SOL\`);`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Monaco Editor */}
          <div className={cn(
            'flex flex-col',
            'w-full lg:w-2/5',
            activeTab === 'content' ? 'hidden lg:flex' : 'flex'
          )}>
            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 shrink-0">
              <span className="text-xs text-gray-400 font-medium">{t('playground')}</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:outline-none"
              >
                <option value="typescript">TypeScript</option>
                <option value="rust">Rust</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                defaultLanguage={language}
                language={language}
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
          </div>
        </div>

        {/* Bottom navigation bar */}
        <div className="shrink-0 border-t border-gray-800 bg-gray-900/80 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {prevLesson ? (
              <Link
                href={localePath(locale, `/lessons/${prevLesson.id}`)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t('previous')}
              </Link>
            ) : <div />}

            <button
              onClick={handleComplete}
              disabled={completing}
              className={cn(
                'flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all',
                completed
                  ? 'bg-green-800/50 border border-green-700 text-green-300 cursor-default'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 hover:scale-105'
              )}
            >
              {completed ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {t('already_complete')}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {t('mark_complete')} (+{lesson.xp} XP)
                </>
              )}
            </button>

            {nextLesson ? (
              <Link
                href={localePath(locale, `/lessons/${nextLesson.id}`)}
                className="flex items-center gap-1.5 rounded-xl bg-gray-700 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-gray-600 transition-all"
              >
                {tCommon('next')}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href={localePath(locale, '/courses/intro-solana')}
                className="flex items-center gap-1.5 rounded-xl bg-green-700 px-3 py-2 text-xs font-medium text-white hover:bg-green-600 transition-all"
              >
                {t('finish')}
                <BookOpen className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
