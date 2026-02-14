"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, CheckCircle2, Play, Lightbulb, Eye, EyeOff, Sparkles, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourse, useProgress, useCompleteLesson } from "@/lib/hooks/use-service";
import type { Challenge } from "@/types/course";
import { highlight } from "@/lib/syntax-highlight";
import { toast } from "sonner";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] rounded-lg" />,
});

export default function LessonPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const { data: course } = useCourse(slug);
  const { data: progress } = useProgress(slug);
  const completeMutation = useCompleteLesson();

  const [code, setCode] = useState<string>("");
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean; message?: string }[] | null>(null);
  const [codeInitialized, setCodeInitialized] = useState(false);
  const [aiLoading, setAiLoading] = useState<"improve" | "autofill" | null>(null);
  const [copied, setCopied] = useState(false);

  const { lesson, lessonIndex, prevLesson, nextLesson } = useMemo(() => {
    if (!course) return { lesson: null, lessonIndex: -1, prevLesson: null, nextLesson: null };
    const allLessons = course.modules.flatMap((m) => m.lessons);
    const idx = allLessons.findIndex((l) => l.id === id);
    const lesson = allLessons[idx] ?? null;
    if (lesson?.challenge && !codeInitialized) {
      setCode(lesson.challenge.starterCode);
      setCodeInitialized(true);
    }
    return {
      lesson,
      lessonIndex: idx,
      prevLesson: idx > 0 ? allLessons[idx - 1] : null,
      nextLesson: idx < allLessons.length - 1 ? allLessons[idx + 1] : null,
    };
  }, [course, id, codeInitialized]);

  const isCompleted = progress?.lessonsCompleted.includes(lessonIndex) ?? false;
  const isChallenge = lesson?.type === "challenge" && lesson?.challenge;
  const allTestsPassed = testResults !== null && testResults.length > 0 && testResults.every((r) => r.passed);

  const handleComplete = () => {
    if (isChallenge && !allTestsPassed) {
      toast.error("Run tests and pass all of them before completing!");
      return;
    }
    completeMutation.mutate(
      { courseId: slug, lessonIndex },
      {
        onSuccess: () => toast.success(`+${lesson?.xpReward ?? 50} XP earned!`),
        onError: () => toast.error("Failed to mark as complete"),
      }
    );
  };

  const handleRunTests = () => {
    if (!lesson?.challenge) return;
    const results = runChallengeTests(code, lesson.challenge);
    setTestResults(results);
    if (results.every((r) => r.passed)) {
      toast.success("All tests passed! You can mark this lesson as complete.");
    } else {
      const failed = results.filter((r) => !r.passed).length;
      toast.error(`${failed} test${failed > 1 ? "s" : ""} failed. Check the hints!`);
    }
  };

  const handleAICode = async (mode: "improve" | "autofill") => {
    if (!lesson?.challenge || aiLoading) return;
    setAiLoading(mode);
    try {
      const res = await fetch("/api/ai-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: lesson.challenge.language,
          prompt: lesson.challenge.prompt,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setCode(data.code);
      toast.success("Code improved by AI!");
    } catch {
      toast.error("AI service unavailable. Try again later.");
    } finally {
      setAiLoading(null);
    }
  };

  if (!course || !lesson) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Lesson not found</h1>
        <Button asChild className="mt-4"><Link href={`/courses/${slug}`}>Back to Course</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/courses/${slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {course.title}
        </Link>
        <div className="flex items-center gap-2">
          {isCompleted && <Badge className="bg-solana-green text-black">Completed</Badge>}
          <Badge variant="xp">{lesson.xpReward} XP</Badge>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
      <p className="text-muted-foreground mb-6">{lesson.description}</p>

      {isChallenge ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Challenge prompt + content */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Challenge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{lesson.challenge!.prompt}</p>
              </CardContent>
            </Card>

            {showHints && (
              <Card>
                <CardHeader><CardTitle className="text-base">Hints</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {lesson.challenge!.hints.map((hint, i) => (
                      <li key={i} className="flex gap-2">
                        <Lightbulb className="h-4 w-4 text-xp-gold shrink-0 mt-0.5" />
                        {hint}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {testResults && (
              <Card>
                <CardHeader><CardTitle className="text-base">Test Results</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testResults.map((r, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 text-sm">
                          {r.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-solana-green" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-destructive" />
                          )}
                          <span className={r.passed ? "text-solana-green" : "text-destructive"}>{r.name}</span>
                        </div>
                        {!r.passed && r.message && (
                          <p className="ml-6 mt-1 text-xs text-muted-foreground">{r.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowHints(!showHints)}>
                <Lightbulb className="h-4 w-4" /> {showHints ? "Hide Hints" : "Show Hints"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSolution(!showSolution)}>
                {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSolution ? "Hide Solution" : "Show Solution"}
              </Button>
            </div>

            {showSolution && (
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b px-4 py-2 bg-[#16161e]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7f849c]">Solution — {lesson.challenge!.language}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[#7f849c] hover:text-white hover:bg-white/10"
                    onClick={() => {
                      navigator.clipboard.writeText(lesson.challenge!.solution);
                      setCopied(true);
                      toast.success("Solution copied!");
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="text-xs ml-1">{copied ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
                <div className="bg-[#1e1e2e] p-4 overflow-x-auto">
                  <pre className="m-0"><code
                    className="font-mono text-[13px] leading-relaxed text-[#cdd6f4]"
                    dangerouslySetInnerHTML={{ __html: highlight(lesson.challenge!.solution, lesson.challenge!.language) }}
                  /></pre>
                </div>
              </Card>
            )}
          </div>

          {/* Right: Code editor */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="text-sm font-medium capitalize">{lesson.challenge!.language}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAICode("improve")}
                    disabled={!!aiLoading}
                    className="text-solana-purple border-solana-purple/30 hover:bg-solana-purple/10"
                  >
                    {aiLoading === "improve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Improve with AI
                  </Button>
                  <Button size="sm" onClick={handleRunTests}>
                    <Play className="h-4 w-4" /> Run Tests
                  </Button>
                </div>
              </div>
              <div className="h-[400px]">
                <MonacoEditor
                  height="100%"
                  language={lesson.challenge!.language === "rust" ? "rust" : "typescript"}
                  theme="vs-dark"
                  value={code}
                  onChange={(v) => setCode(v ?? "")}
                  beforeMount={(monaco) => {
                    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                      noSemanticValidation: true,
                      noSyntaxValidation: false,
                    });
                    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                      target: monaco.languages.typescript.ScriptTarget.ESNext,
                      module: monaco.languages.typescript.ModuleKind.ESNext,
                      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                      allowNonTsExtensions: true,
                      noEmit: true,
                    });
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    padding: { top: 16 },
                  }}
                />
              </div>
            </Card>

            {!isCompleted && (
              <Button
                onClick={handleComplete}
                size="sm"
                variant={allTestsPassed ? "solana" : "outline"}
                disabled={completeMutation.isPending || !allTestsPassed}
              >
                <CheckCircle2 className="h-4 w-4" />
                {completeMutation.isPending ? "Completing..." : allTestsPassed ? "Mark Complete" : "Pass All Tests First"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Content lesson */
        <div className="max-w-3xl">
          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.content ?? "") }} />
            </CardContent>
          </Card>
          {!isCompleted && (
            <Button onClick={handleComplete} size="sm" className="mt-6" variant="solana" disabled={completeMutation.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {completeMutation.isPending ? "Completing..." : "Mark Complete"}
            </Button>
          )}
        </div>
      )}

      <Separator className="my-8" />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {prevLesson ? (
          <Button asChild variant="outline">
            <Link href={`/courses/${slug}/lessons/${prevLesson.id}`}>
              <ArrowLeft className="h-4 w-4" /> {prevLesson.title}
            </Link>
          </Button>
        ) : <div />}
        {nextLesson ? (
          <Button asChild>
            <Link href={`/courses/${slug}/lessons/${nextLesson.id}`}>
              {nextLesson.title} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="solana">
            <Link href={`/courses/${slug}`}>Back to Course</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function renderMarkdown(md: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // 1. Extract fenced code blocks FIRST
  const codeBlocks: string[] = [];
  let html = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = codeBlocks.length;
    const langLabel = lang || "code";
    codeBlocks.push(
      `<div class="lesson-code-block"><div class="lesson-code-lang">${langLabel}</div><pre><code>${highlight(code.trimEnd(), langLabel)}</code></pre></div>`
    );
    return `\x00CB${idx}\x00`;
  });

  // 2. Inline code
  html = html.replace(/`([^`\n]+)`/g, (_m, code) =>
    `<code class="lesson-inline-code">${esc(code)}</code>`
  );

  // 3. Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 4. Bold & italic
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");

  // 5. Lists
  html = html.replace(/(^[-*]\s+.+$(\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map((l) => `<li>${l.replace(/^[-*]\s+/, "")}</li>`).join("");
    return `<ul>${items}</ul>`;
  });
  html = html.replace(/(^\d+\.\s+.+$(\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map((l) => `<li>${l.replace(/^\d+\.\s+/, "")}</li>`).join("");
    return `<ol>${items}</ol>`;
  });

  // 6. Paragraphs
  html = html.split(/\n{2,}/).map((block) => {
    const t = block.trim();
    if (!t) return "";
    if (/^<[hupold]|^\x00CB/.test(t)) return t;
    return `<p>${t.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");

  // 7. Re-insert code blocks
  html = html.replace(/\x00CB(\d+)\x00/g, (_m, idx) => codeBlocks[Number(idx)]);
  return html;
}

function runChallengeTests(
  code: string,
  challenge: Challenge
): { name: string; passed: boolean; message?: string }[] {
  const clean = code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const hasPlaceholder = /\/\/\s*your code here/i.test(code);

  const solutionPatterns = extractPatterns(challenge.solution);

  return challenge.testCases.map((tc) => {
    if (hasPlaceholder && clean.trim() === challenge.starterCode.replace(/\/\/.*$/gm, "").trim()) {
      return { name: tc.name, passed: false, message: "Replace the placeholder comments with your implementation" };
    }

    const results = solutionPatterns.map((p) => ({
      pattern: p.label,
      found: p.regex.test(clean),
    }));

    const matchCount = results.filter((r) => r.found).length;
    const totalPatterns = results.length;

    if (matchCount === totalPatterns) {
      return { name: tc.name, passed: true };
    }

    const missing = results.filter((r) => !r.found).map((r) => r.pattern);
    return {
      name: tc.name,
      passed: false,
      message: `Missing: ${missing.join(", ")}`,
    };
  });
}

function extractPatterns(solution: string): { label: string; regex: RegExp }[] {
  const patterns: { label: string; regex: RegExp }[] = [];
  const clean = solution.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  // Detect Keypair.generate()
  if (/Keypair\.generate\(\)/.test(clean)) {
    patterns.push({ label: "Keypair.generate()", regex: /Keypair\.generate\(\)/ });
  }
  // Detect .toBase58()
  if (/\.toBase58\(\)/.test(clean)) {
    patterns.push({ label: ".toBase58()", regex: /\.toBase58\(\)/ });
  }
  // Detect .secretKey
  if (/\.secretKey/.test(clean)) {
    patterns.push({ label: ".secretKey", regex: /\.secretKey/ });
  }
  // Detect new PublicKey(...)
  if (/new\s+PublicKey\(/.test(clean)) {
    patterns.push({ label: "new PublicKey()", regex: /new\s+PublicKey\(/ });
  }
  // Detect SystemProgram.transfer
  if (/SystemProgram\.transfer\(/.test(clean)) {
    patterns.push({ label: "SystemProgram.transfer()", regex: /SystemProgram\.transfer\(/ });
  }
  // Detect sendAndConfirmTransaction
  if (/sendAndConfirmTransaction\(/.test(clean)) {
    patterns.push({ label: "sendAndConfirmTransaction()", regex: /sendAndConfirmTransaction\(/ });
  }
  // Detect Transaction().add
  if (/new\s+Transaction\(\)\.add\(/.test(clean)) {
    patterns.push({ label: "new Transaction().add()", regex: /new\s+Transaction\(\)\.add\(/ });
  }
  // Detect findProgramAddressSync
  if (/findProgramAddressSync\(/.test(clean)) {
    patterns.push({ label: "findProgramAddressSync()", regex: /findProgramAddressSync\(/ });
  }
  // Detect Buffer.from
  if (/Buffer\.from\(/.test(clean)) {
    patterns.push({ label: "Buffer.from()", regex: /Buffer\.from\(/ });
  }
  // Detect .toBuffer()
  if (/\.toBuffer\(\)/.test(clean)) {
    patterns.push({ label: ".toBuffer()", regex: /\.toBuffer\(\)/ });
  }
  // Detect return statement (user must return something, not leave empty)
  if (/return\s+[^;]+/.test(clean)) {
    patterns.push({ label: "return statement", regex: /return\s+[^;]+/ });
  }

  // Fallback: if no specific patterns detected, check that code differs from a typical starter
  if (patterns.length === 0) {
    patterns.push({ label: "implementation", regex: /(?:return|=>|=)\s*[^\/\n]+/ });
  }

  return patterns;
}
