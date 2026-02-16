'use client';

import { use, useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Zap,
  CheckCircle2,
  Play,
  RotateCcw,
  Lightbulb,
  Eye,
  EyeOff,
  BookOpen,
  Code,
  Trophy,
  Loader2,
  X,
  ChevronDown,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_COURSES, MOCK_PROGRESS } from '@/services/mock-data';
import { getStarterCodeForLesson } from '@/services/lesson-starter-code';
import { TRACK_INFO } from '@/config/constants';
import { useUserStore } from '@/stores/user-store';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';

// Dynamic import for Monaco editor (heavy component)
const CodeEditor = dynamic(
  () => import('@/components/editor/code-editor').then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[#0D1117] animate-pulse">
        <Code className="h-8 w-8 text-muted-foreground/30" />
      </div>
    ),
  }
);

// Sample rich lesson content
const SAMPLE_LESSON_CONTENT = `## What You'll Learn

In this lesson, you'll master the core concepts that form the foundation of this topic. By the end, you'll be able to apply these concepts in real-world Solana development.

### Core Concepts

Solana uses a unique **account model** that differs from other blockchains. Every piece of data on Solana is stored in an **account**, and programs (smart contracts) are stateless executables that operate on these accounts.

> **Pro Tip:** Take your time with each concept. The XP is earned through understanding, not speed. Practice each example in the code editor on the right.

### Key Points

- Solana programs are **stateless** — they don't store data themselves
- All data lives in **accounts** that are passed to programs
- Programs are identified by their **Program ID** (a public key)
- Accounts have an **owner** field that determines which program can modify them

### Example: Reading an Account Balance

\`\`\`typescript
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const publicKey = new PublicKey("YOUR_WALLET_ADDRESS");

const balance = await connection.getBalance(publicKey);
console.log(\`Balance: \${balance / LAMPORTS_PER_SOL} SOL\`);
\`\`\`

### The Account Model

| Field | Type | Description |
|-------|------|-------------|
| \`lamports\` | u64 | Balance in lamports (1 SOL = 1B lamports) |
| \`data\` | byte[] | Raw data stored by the account |
| \`owner\` | PublicKey | Program that owns this account |
| \`executable\` | bool | Whether this account contains a program |
| \`rent_epoch\` | u64 | Epoch at which rent is next due |

### Practice

Try modifying the code example in the editor. Experiment with different RPC endpoints and account addresses to see how Solana accounts work in practice.

> **Challenge:** Can you modify the code to also fetch the account info and print the owner?
`;

export default function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const { isAuthenticated, updateXP } = useUserStore();
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<
    { name: string; passed: boolean }[]
  >([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [editorWidth, setEditorWidth] = useState(50); // percentage
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  // Find course and lesson
  const course = useMemo(
    () => MOCK_COURSES.find((c) => c.slug === slug),
    [slug]
  );

  const { lesson, moduleIndex, lessonIndex, prevLesson, nextLesson } = useMemo(() => {
    if (!course) return { lesson: null, moduleIndex: 0, lessonIndex: 0, prevLesson: null, nextLesson: null };

    let prevL: { id: string } | null = null;
    let foundLesson = null;
    let foundModuleIndex = 0;
    let foundLessonIndex = 0;
    let nextL: { id: string } | null = null;
    let foundIt = false;

    for (const [mi, mod] of course.modules.entries()) {
      for (const [li, les] of mod.lessons.entries()) {
        if (foundIt && !nextL) {
          nextL = les;
          break;
        }
        if (les.id === id) {
          foundLesson = les;
          foundModuleIndex = mi;
          foundLessonIndex = li;
          foundIt = true;
        } else if (!foundIt) {
          prevL = les;
        }
      }
      if (nextL) break;
    }

    return {
      lesson: foundLesson,
      moduleIndex: foundModuleIndex,
      lessonIndex: foundLessonIndex,
      prevLesson: prevL,
      nextLesson: nextL,
    };
  }, [course, id]);

  // Initialize code: challenge lessons use their starterCode; content/quiz use lesson-specific code
  const initialCode = useMemo(() => {
    if (lesson?.challenge) return lesson.challenge.starterCode;
    return getStarterCodeForLesson(lesson?.id ?? '', course?.slug);
  }, [lesson, course?.slug]);

  // Set initial code when lesson changes
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  if (!course || !lesson) {
    notFound();
  }

  const trackInfo = TRACK_INFO[course.track];
  const isChallenge = lesson.type === 'challenge' && lesson.challenge;

  // Run code in sandboxed Web Worker (imports stripped so no "Connection already declared" error)
  const runCodeInWorker = useCallback(
    (userCode: string, testCases: { name: string; expectedOutput: string }[]): Promise<{
      logs: string[];
      errors: string[];
      testResults: { name: string; passed: boolean }[];
    }> => {
      return new Promise((resolve) => {
        try {
          const worker = new Worker('/code-runner.js?v=2');
          const timeout = setTimeout(() => {
            worker.terminate();
            resolve({ logs: ['Execution timed out (3s limit)'], errors: ['Timeout'], testResults: [] });
          }, 5000);

          worker.onmessage = (e) => {
            clearTimeout(timeout);
            worker.terminate();
            resolve(e.data);
          };

          worker.onerror = (err) => {
            clearTimeout(timeout);
            worker.terminate();
            resolve({ logs: [], errors: [err.message || 'Worker error'], testResults: [] });
          };

          worker.postMessage({ code: userCode, testCases });
        } catch {
          resolve({ logs: [], errors: ['Failed to start code runner'], testResults: [] });
        }
      });
    },
    []
  );

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setOutput([]);
    setTestResults([]);

    setOutput(['> Compiling...']);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setOutput((prev) => [...prev, '> Executing code in sandbox...']);

    const testCases = lesson.challenge
      ? lesson.challenge.testCases.map((tc) => ({ name: tc.name, expectedOutput: tc.expectedOutput }))
      : [];

    const result = await runCodeInWorker(code, testCases);

    const outputLines: string[] = ['> Compiling...', '> Executing code in sandbox...'];
    if (result.logs.length > 0) {
      outputLines.push('', '--- Console Output ---');
      result.logs.forEach((line) => outputLines.push('  ' + line));
    }
    if (result.errors.length > 0) {
      outputLines.push('', '--- Errors ---');
      result.errors.forEach((line) => outputLines.push('  \u2718 ' + line));
    }

    if (lesson.challenge && result.testResults.length > 0) {
      outputLines.push('', '--- Test Results ---');
      result.testResults.forEach((tr) => {
        outputLines.push(`${tr.passed ? '\u2714 PASS' : '\u2718 FAIL'} ${tr.name}`);
      });
      const passCount = result.testResults.filter((r) => r.passed).length;
      outputLines.push(
        '',
        passCount === result.testResults.length
          ? '> \u2728 All tests passed! Quest complete!'
          : `> ${passCount}/${result.testResults.length} tests passed. Keep going!`
      );

      setTestResults(result.testResults.map((r) => ({ name: r.name, passed: r.passed })));

      if (result.testResults.every((r) => r.passed) && !isComplete) {
        setIsComplete(true);
        setShowXPAnimation(true);
        updateXP(lesson.xpReward);
        setTimeout(() => setShowXPAnimation(false), 2500);
      }
    } else if (!lesson.challenge && result.errors.length === 0) {
      outputLines.push('', '> Code executed successfully!');
    }

    setOutput(outputLines);
    setIsRunning(false);
  }, [code, lesson, isComplete, updateXP, runCodeInWorker]);

  const handleMarkComplete = useCallback(() => {
    setIsComplete(true);
    setShowXPAnimation(true);
    updateXP(lesson.xpReward);
    setTimeout(() => setShowXPAnimation(false), 2500);
  }, [lesson.xpReward, updateXP]);

  const handleResetCode = useCallback(() => {
    setCode(initialCode);
    setOutput([]);
    setTestResults([]);
  }, [initialCode]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* XP Animation Overlay */}
      <AnimatePresence>
        {showXPAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="relative">
              {/* Glow background */}
              <div className="absolute inset-0 bg-quest-gold/20 blur-3xl rounded-full scale-150" />
              <div className="relative flex items-center gap-3 bg-background/95 backdrop-blur-xl border-2 border-quest-gold/50 rounded-2xl px-8 py-4 shadow-2xl glow-gold">
                <Sparkles className="h-8 w-8 text-quest-gold animate-pulse" />
                <div>
                  <p className="text-sm text-muted-foreground">XP Earned</p>
                  <p className="text-3xl font-bold text-quest-gold">
                    +{lesson.xpReward} XP
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson Header Bar */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-16 z-30">
        <div className="mx-auto max-w-[1800px] px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Link
              href={`/courses/${slug}`}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline truncate max-w-[200px]">
                {course.title}
              </span>
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{lesson.title}</span>
          </div>

          <div className="flex items-center gap-2">
            {isComplete && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <Badge className="bg-quest-health/10 text-quest-health border-quest-health/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </motion.div>
            )}
            <Badge variant="outline" className="gap-1 text-xs">
              <Zap className="h-3 w-3 text-quest-gold" />
              {lesson.xpReward} XP
            </Badge>
            {isChallenge && (
              <Badge
                variant="secondary"
                className={`text-xs ${
                  lesson.challenge?.difficulty === 'boss'
                    ? 'bg-quest-gold/10 text-quest-gold border-quest-gold/20'
                    : 'bg-quest-purple/10 text-quest-purple border-quest-purple/20'
                }`}
              >
                {lesson.challenge?.difficulty === 'boss'
                  ? '\u2694\uFE0F Boss Battle'
                  : '\u2699\uFE0F Challenge'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Left: Content Panel */}
        <div
          className="flex-1 overflow-auto border-r border-border/40"
          style={{ flexBasis: `${100 - editorWidth}%` }}
        >
          <div className="max-w-3xl mx-auto p-6 lg:p-8">
            {/* Challenge Prompt */}
            {isChallenge && lesson.challenge && (
              <div className="mb-8">
                {/* Challenge Header */}
                <div className="flex items-center gap-3 mb-4">
                  {lesson.challenge.difficulty === 'boss' ? (
                    <div className="w-10 h-10 rounded-lg bg-quest-gold/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-quest-gold" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-quest-purple/10 flex items-center justify-center">
                      <Code className="h-5 w-5 text-quest-purple" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">
                      {lesson.challenge.difficulty === 'boss' ? 'Boss Battle: ' : ''}
                      {lesson.challenge.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {lesson.challenge.difficulty.charAt(0).toUpperCase() +
                        lesson.challenge.difficulty.slice(1)}{' '}
                      &bull; {lesson.challenge.language}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {lesson.challenge.prompt}
                </p>

                {/* Test Cases */}
                <div className="space-y-2 mb-6">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Test Cases
                  </h3>
                  {lesson.challenge.testCases
                    .filter((tc) => !tc.isHidden)
                    .map((tc, i) => (
                      <motion.div
                        key={tc.id}
                        initial={testResults[i] ? { scale: 0.98 } : false}
                        animate={{ scale: 1 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          testResults[i]
                            ? testResults[i].passed
                              ? 'border-quest-health/30 bg-quest-health/5'
                              : 'border-destructive/30 bg-destructive/5'
                            : 'border-border/50 bg-muted/20'
                        }`}
                      >
                        {testResults[i] ? (
                          testResults[i].passed ? (
                            <CheckCircle2 className="h-4 w-4 text-quest-health flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-destructive flex-shrink-0" />
                          )
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-border flex-shrink-0" />
                        )}
                        <span className="text-sm">{tc.name}</span>
                      </motion.div>
                    ))}
                </div>

                {/* Hints */}
                {lesson.challenge.hints.length > 0 && (
                  <div className="mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHints(!showHints)}
                      className="gap-2 text-muted-foreground hover:text-quest-gold"
                    >
                      <Lightbulb className="h-4 w-4" />
                      {showHints ? 'Hide Hints' : `Show Hints (${lesson.challenge.hints.length})`}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${showHints ? 'rotate-180' : ''}`}
                      />
                    </Button>
                    <AnimatePresence>
                      {showHints && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-2">
                            {lesson.challenge.hints
                              .slice(0, currentHint + 1)
                              .map((hint, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="p-3 rounded-lg bg-quest-gold/5 border border-quest-gold/20 text-sm"
                                >
                                  <span className="font-semibold text-quest-gold">
                                    Hint {i + 1}:
                                  </span>{' '}
                                  {hint}
                                </motion.div>
                              ))}
                            {currentHint < lesson.challenge.hints.length - 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentHint((prev) => prev + 1)}
                                className="text-xs text-muted-foreground"
                              >
                                Reveal next hint...
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Solution Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSolution(!showSolution)}
                  className="gap-2 text-muted-foreground"
                >
                  {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showSolution ? 'Hide Solution' : 'View Solution'}
                </Button>
                <AnimatePresence>
                  {showSolution && lesson.challenge.solution && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="mt-2 p-4 rounded-lg bg-[#0D1117] border border-border/30 overflow-x-auto">
                        <code className="text-sm font-mono text-[#E6EDF3]">
                          {lesson.challenge.solution}
                        </code>
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Content Lessons - Rich Markdown */}
            {(lesson.type === 'content' || lesson.type === 'video') && (
              <>
                <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
                <p className="text-muted-foreground mb-6">{lesson.description}</p>
                <MarkdownRenderer content={SAMPLE_LESSON_CONTENT} />

                {/* Mark Complete */}
                {!isComplete && (
                  <div className="mt-10 pt-6 border-t border-border/50">
                    <Button
                      onClick={handleMarkComplete}
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90 border-0"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Mark as Complete (+{lesson.xpReward} XP)
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Quiz type */}
            {lesson.type === 'quiz' && (
              <>
                <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
                <p className="text-muted-foreground mb-6">{lesson.description}</p>

                <div className="space-y-6">
                  {/* Sample quiz questions */}
                  {[
                    {
                      q: 'What consensus mechanism does Solana use?',
                      options: ['Proof of Work', 'Proof of Stake', 'Proof of History', 'Delegated Proof of Stake'],
                      correct: 2,
                    },
                    {
                      q: 'How is data stored on Solana?',
                      options: ['In smart contract storage', 'In accounts', 'In blocks', 'In memory pools'],
                      correct: 1,
                    },
                    {
                      q: 'What is a Program ID?',
                      options: ['A database index', 'A public key identifying a program', 'A transaction hash', 'A block number'],
                      correct: 1,
                    },
                  ].map((question, qi) => (
                    <Card key={qi} className="border-border/50">
                      <CardContent className="p-5">
                        <p className="font-medium mb-3">
                          <span className="text-primary mr-2">Q{qi + 1}.</span>
                          {question.q}
                        </p>
                        <div className="space-y-2">
                          {question.options.map((opt, oi) => {
                            const isSelected = quizAnswers[qi] === oi;
                            return (
                              <button
                                key={oi}
                                onClick={() => setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                                className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
                                }`}
                              >
                                <span className="text-muted-foreground mr-2">
                                  {String.fromCharCode(65 + oi)}.
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {!isComplete && (
                  <div className="mt-8">
                    <Button
                      onClick={handleMarkComplete}
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90 border-0"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Submit Answers (+{lesson.xpReward} XP)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Code Editor Panel */}
        <div
          className="flex flex-col border-t lg:border-t-0 min-h-[300px] lg:min-h-0"
          style={{ flexBasis: `${editorWidth}%` }}
        >
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 h-11 border-b border-border/40 bg-muted/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* File tab */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-background border border-border/50 text-xs">
                <Code className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono">
                  {isChallenge
                    ? `challenge.${lesson.challenge?.language || 'ts'}`
                    : 'playground.ts'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleResetCode}
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5 bg-quest-health text-white hover:bg-quest-health/90"
                onClick={handleRunCode}
                disabled={isRunning}
              >
                {isRunning ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                {isRunning ? 'Running...' : 'Run Code'}
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={code || initialCode}
              onChange={setCode}
              language={lesson.challenge?.language || 'typescript'}
              height="100%"
            />
          </div>

          {/* Output Panel */}
          <AnimatePresence>
            {output.length > 0 && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="border-t border-border/40 overflow-hidden flex-shrink-0"
              >
                <div className="px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground flex items-center justify-between">
                  <span>Output</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-xs px-2"
                    onClick={() => {
                      setOutput([]);
                      setTestResults([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <div className="p-4 max-h-[180px] overflow-auto bg-[#0D1117] text-sm font-mono">
                  {output.map((line, i) => (
                    <div
                      key={i}
                      className={`leading-relaxed ${
                        line.includes('PASS') || line.includes('\u2714')
                          ? 'text-[#14F195]'
                          : line.includes('FAIL') || line.includes('\u2718')
                          ? 'text-[#FF4D4D]'
                          : line.startsWith('>')
                          ? line.includes('\u2728')
                            ? 'text-[#F0B90B]'
                            : 'text-[#8B949E]'
                          : 'text-[#E6EDF3]'
                      }`}
                    >
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-border/40 bg-background/80 backdrop-blur-xl flex-shrink-0">
        <div className="mx-auto max-w-[1800px] px-4 h-14 flex items-center justify-between">
          {prevLesson ? (
            <Link href={`/courses/${slug}/lessons/${prevLesson.id}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <div className="text-xs text-muted-foreground hidden sm:block">
            Chapter {moduleIndex + 1}, Lesson {lessonIndex + 1}
          </div>

          {nextLesson ? (
            <Link href={`/courses/${slug}/lessons/${nextLesson.id}`}>
              <Button
                variant={isComplete ? 'default' : 'ghost'}
                size="sm"
                className={`gap-2 ${
                  isComplete
                    ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90 border-0'
                    : ''
                }`}
              >
                <span className="hidden sm:inline">Next Lesson</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href={`/courses/${slug}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="hidden sm:inline">Back to Quest</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
