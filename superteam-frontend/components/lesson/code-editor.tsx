"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  Zap,
  ArrowRight,
  PartyPopper,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[hsl(200,10%,7%)]">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Loading editor...</span>
      </div>
    </div>
  ),
});

const defaultStarterCode = `use anchor_lang::prelude::*;

declare_id!("YourProgramId1111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Initialize the counter account
        // Set count to 0
        // Set authority to the signer
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Increment the counter
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 8 + 32)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}`;

const defaultTestCases = [
  { name: "Initializes counter to 0", expected: "count" },
  { name: "Sets correct authority", expected: "authority" },
  { name: "Increments counter by 1", expected: "increment" },
  { name: "Rejects unauthorized increment", expected: "has_one" },
];

type TestCase = {
  name: string;
  expected: string;
  passed?: boolean;
};

type CodeEditorProps = {
  language?: string;
  starterCode?: string;
  testCases?: TestCase[];
  onComplete?: () => void;
  courseSlug?: string;
  nextLessonId?: string | null;
};

export function CodeEditor({
  language = "rust",
  starterCode = defaultStarterCode,
  testCases: testCasesProp,
  onComplete,
  courseSlug,
  nextLessonId,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<unknown>(null);

  const initialTestCases = (testCasesProp ?? defaultTestCases).map((t) => ({
    ...t,
    passed: undefined as boolean | undefined,
  }));

  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [tests, setTests] = useState(initialTestCases);
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [readOnly, setReadOnly] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const completedRef = useRef(false);

  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

  const handleEditorDidMount = useCallback((editor: unknown) => {
    editorRef.current = editor;
    if (editor && typeof editor === "object" && "getModel" in editor) {
      const ed = editor as { getModel: () => unknown; focus: () => void };
      ed.focus();
    }
  }, []);

  const handleRun = useCallback(() => {
    setRunning(true);
    setOutput("");
    setActiveTab("output");

    setTimeout(() => {
      const currentCode = code;
      const currentTests = testCasesProp ?? defaultTestCases;

      const results = currentTests.map((t) => {
        const pattern = t.expected.toLowerCase();
        const passed = currentCode.toLowerCase().includes(pattern);
        return { ...t, passed };
      });

      setTests(results);

      const allPassed = results.every((t) => t.passed);

      if (allPassed) {
        const lines = [
          "Compiling program...",
          "Deploying to devnet...",
          "Running test suite...",
          "",
          ...results.map((t) => `  \u2713 ${t.name}`),
          "",
          "\u2713 All tests passed!",
          "",
          "Transaction confirmed: Success",
          `Program deployed at: ${generateFakeAddress()}`,
        ];
        setOutput(lines.join("\n"));

        if (!completedRef.current) {
          completedRef.current = true;
          setCompleted(true);
          setShowConfetti(true);
          onComplete?.();
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } else {
        const failedTests = results.filter((t) => !t.passed);
        const lines = [
          "Compiling program...",
          "Deploying to devnet...",
          "Running test suite...",
          "",
          ...results.map(
            (t) => `  ${t.passed ? "\u2713" : "\u2717"} ${t.name}`,
          ),
          "",
          `\u2717 ${failedTests.length} test${failedTests.length > 1 ? "s" : ""} failed`,
          "",
          ...failedTests.map(
            (t) =>
              `Error: "${t.name}" failed\n  Expected code to contain: ${t.expected}`,
          ),
        ];
        setOutput(lines.join("\n"));
      }

      setRunning(false);
      setActiveTab("tests");
    }, 1500);
  }, [code, testCasesProp, onComplete]);

  const handleReset = useCallback(() => {
    setCode(starterCode);
    setTests(initialTestCases);
    setOutput("");
    setCompleted(false);
    setShowConfetti(false);
    completedRef.current = false;
  }, [starterCode, initialTestCases]);

  const fileExtension =
    language === "rust"
      ? ".rs"
      : language === "typescript"
        ? ".ts"
        : language === "json"
          ? ".json"
          : "";
  const fileName = `main${fileExtension}`;
  const languageLabel = language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div className="flex h-full flex-col bg-[hsl(200,10%,7%)] relative overflow-hidden">
      {/* Confetti animation overlay */}
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="confetti-particle absolute"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random() * 1.5}s`,
                backgroundColor: [
                  "hsl(var(--primary))",
                  "hsl(var(--gold))",
                  "#22c55e",
                  "#3b82f6",
                  "#f59e0b",
                  "#ec4899",
                ][i % 6],
              }}
            />
          ))}
          <style jsx>{`
            @keyframes confetti-fall {
              0% {
                transform: translateY(-10px) rotate(0deg) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) rotate(720deg) scale(0.3);
                opacity: 0;
              }
            }
            .confetti-particle {
              width: 8px;
              height: 8px;
              border-radius: 2px;
              animation: confetti-fall linear forwards;
            }
          `}</style>
        </div>
      )}

      {/* Editor toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-border bg-card px-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] border-border text-muted-foreground font-mono"
          >
            {fileName}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] border-border text-muted-foreground"
          >
            {languageLabel}
          </Badge>
          {readOnly && (
            <Badge
              variant="outline"
              className="text-[10px] border-yellow-500/30 text-yellow-500"
            >
              Read Only
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReadOnly(!readOnly)}
            className="h-7 w-7 p-0 text-muted-foreground"
            title={readOnly ? "Enable editing" : "Set read-only"}
          >
            {readOnly ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs text-muted-foreground gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={running}
            className="h-7 bg-primary text-primary-foreground hover:bg-primary/90 gap-1 text-xs"
          >
            {running ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {running ? "Running..." : "Run Code"}
          </Button>
        </div>
      </div>

      {/* Editor + output split */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="h-9 w-full justify-start rounded-none border-b border-border bg-card px-2">
          <TabsTrigger
            value="editor"
            className="text-xs data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground"
          >
            Editor
          </TabsTrigger>
          <TabsTrigger
            value="output"
            className="text-xs data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground"
          >
            Output
          </TabsTrigger>
          <TabsTrigger
            value="tests"
            className="text-xs data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground"
          >
            Tests
            {tests.some((t) => t.passed !== undefined) && (
              <span className="ml-1.5 text-[10px]">
                ({tests.filter((t) => t.passed).length}/{tests.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
          <MonacoEditor
            height="100%"
            language={language}
            theme={monacoTheme}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            onMount={handleEditorDidMount}
            options={{
              readOnly,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              lineNumbers: "on",
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              smoothScrolling: true,
              cursorSmoothCaretAnimation: "on",
              renderLineHighlight: "line",
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              tabSize: 4,
              insertSpaces: true,
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
            }}
          />
        </TabsContent>

        <TabsContent value="output" className="flex-1 m-0 overflow-hidden">
          <div className="h-full overflow-auto p-4">
            {output ? (
              <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {output.split("\n").map((line, i) => {
                  let className = "text-muted-foreground";
                  if (line.startsWith("  \u2713")) {
                    className = "text-green-400";
                  } else if (line.startsWith("\u2713")) {
                    className = "text-green-400 font-semibold";
                  } else if (
                    line.startsWith("  \u2717") ||
                    line.startsWith("\u2717")
                  ) {
                    className = "text-red-400";
                  } else if (line.startsWith("Error:")) {
                    className = "text-red-400";
                  } else if (line.includes("Expected")) {
                    className = "text-red-300/70";
                  } else if (line.startsWith("Transaction confirmed")) {
                    className = "text-primary font-semibold";
                  } else if (line.startsWith("Program deployed")) {
                    className = "text-primary/80";
                  }
                  return (
                    <span key={i} className={className}>
                      {line}
                      {"\n"}
                    </span>
                  );
                })}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click &quot;Run Code&quot; to see the output.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tests" className="flex-1 m-0 overflow-hidden">
          <div className="h-full overflow-auto p-4 space-y-2">
            {tests.map((test) => (
              <div
                key={test.name}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                {test.passed === undefined ? (
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                ) : test.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    test.passed === undefined
                      ? "text-muted-foreground"
                      : test.passed
                        ? "text-foreground"
                        : "text-destructive"
                  }`}
                >
                  {test.name}
                </span>
                {test.passed !== undefined && (
                  <Badge
                    variant="outline"
                    className={`ml-auto text-[10px] ${
                      test.passed
                        ? "border-primary/30 text-primary"
                        : "border-destructive/30 text-destructive"
                    }`}
                  >
                    {test.passed ? "PASS" : "FAIL"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Success banner */}
      {completed && (
        <div className="border-t border-primary/30 bg-primary/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PartyPopper className="h-5 w-5 text-[hsl(var(--gold))]" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Challenge Complete!
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3 text-primary" /> +120 XP earned
                </p>
              </div>
            </div>
            {nextLessonId && courseSlug && (
              <Link href={`/courses/${courseSlug}/lessons/${nextLessonId}`}>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                >
                  Next Lesson
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function generateFakeAddress(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
  const prefix = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  const suffix = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `${prefix}...${suffix}`;
}
