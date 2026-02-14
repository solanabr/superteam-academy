"use client";

import { useState, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code2,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Terminal,
  FileCode,
  Lightbulb,
  RotateCcw,
  Copy,
  Check,
  Menu,
  X,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useProgress } from "@/contexts/ProgressContext";
import { ConnectButton } from "@/components/wallet/ConnectButton";

// Mock lesson data
const lesson = {
  id: "les-6",
  moduleId: "mod-2",
  courseSlug: "solana-101",
  title: "Practice: Create a Keypair",
  type: "code",
  duration: "10 min",
  xpReward: 50,
  content: `
# Create a Solana Keypair

In this lesson, you'll learn how to programmatically generate a new Solana keypair using the \`@solana/web3.js\` library.

## What is a Keypair?

A keypair consists of:
- **Public Key**: Your wallet address (safe to share)
- **Secret Key**: Your private key (never share this!)

## Your Task

Write a function that:
1. Generates a new random keypair
2. Returns an object with the public key as a base58 string

## Hints
- Use \`Keypair.generate()\` to create a new keypair
- The public key has a \`.toBase58()\` method
`,
  starterCode: `import { Keypair } from "@solana/web3.js";

/**
 * Generate a new Solana keypair and return its public key
 * @returns {{ publicKey: string }} Object with public key as base58 string
 */
export function createKeypair(): { publicKey: string } {
  // TODO: Generate a new keypair
  // TODO: Return the public key as base58

  return {
    publicKey: ""
  };
}
`,
  solutionCode: `import { Keypair } from "@solana/web3.js";

/**
 * Generate a new Solana keypair and return its public key
 * @returns {{ publicKey: string }} Object with public key as base58 string
 */
export function createKeypair(): { publicKey: string } {
  const keypair = Keypair.generate();

  return {
    publicKey: keypair.publicKey.toBase58()
  };
}
`,
  tests: [
    { name: "Returns an object with publicKey property", passed: false },
    { name: "Public key is a valid base58 string (32-44 chars)", passed: false },
    { name: "Each call generates a unique keypair", passed: false }
  ],
  previousLesson: { id: "les-5", title: "Configuring Your Wallet" },
  nextLesson: { id: "les-7", title: "Anatomy of a Transaction" }
};

export default function LessonPage() {
  const { completeLesson, isLessonCompleted, progress } = useProgress();
  const [code, setCode] = useState(lesson.starterCode);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(lesson.tests);
  const [showSolution, setShowSolution] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"output" | "tests">("tests");

  const [lessonCompleted, setLessonCompleted] = useState(false);

  // Check if lesson was previously completed
  useEffect(() => {
    const completed = isLessonCompleted(lesson.id, lesson.courseSlug);
    if (completed) {
      setLessonCompleted(true);
    }
  }, [isLessonCompleted]);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutput("");
    setActiveTab("tests");

    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock test results based on code content
    const hasGenerate = code.includes("Keypair.generate()");
    const hasToBase58 = code.includes("toBase58()");
    const hasReturn = code.includes("publicKey:") && !code.includes('publicKey: ""');

    const newResults = [
      { name: "Returns an object with publicKey property", passed: hasReturn },
      { name: "Public key is a valid base58 string (32-44 chars)", passed: hasGenerate && hasToBase58 },
      { name: "Each call generates a unique keypair", passed: hasGenerate }
    ];

    setTestResults(newResults);

    if (newResults.every(t => t.passed)) {
      setOutput("All tests passed! You've earned 50 XP.");
      // Persist the completion
      if (!lessonCompleted) {
        await completeLesson(lesson.id, lesson.courseSlug, lesson.xpReward);
        setLessonCompleted(true);
      }
    } else {
      const failed = newResults.filter(t => !t.passed).length;
      setOutput(`${failed} test(s) failed. Check your code and try again.`);
    }

    setIsRunning(false);
  }, [code, completeLesson, lessonCompleted]);

  const resetCode = () => {
    setCode(lesson.starterCode);
    setTestResults(lesson.tests);
    setOutput("");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allTestsPassed = testResults.every(t => t.passed);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation */}
      <header className="h-14 border-b flex items-center px-4 gap-4 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <Link href="/" className="flex items-center gap-2 font-bold">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">Superteam Academy</span>
        </Link>

        <div className="h-6 w-px bg-border mx-2" />

        <Link
          href={`/courses/${lesson.courseSlug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to course</span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            {progress?.totalXP || 0} XP
          </Badge>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Lesson Content */}
        <aside
          className={`
            w-full lg:w-[400px] xl:w-[450px] border-r bg-muted/30 overflow-y-auto shrink-0
            absolute lg:relative z-10 h-[calc(100vh-3.5rem)]
            transition-transform lg:transition-none
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="gap-1">
                <FileCode className="h-3 w-3" />
                {lesson.type}
              </Badge>
              <Badge variant="outline">{lesson.duration}</Badge>
            </div>

            <h1 className="text-2xl font-bold mb-6">{lesson.title}</h1>

            {/* Lesson Content (Markdown) */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h2 className="text-lg font-semibold mt-0">Create a Solana Keypair</h2>
              <p className="text-muted-foreground">
                In this lesson, you&apos;ll learn how to programmatically generate a new
                Solana keypair using the <code>@solana/web3.js</code> library.
              </p>

              <h3 className="text-base font-medium">What is a Keypair?</h3>
              <p className="text-muted-foreground">A keypair consists of:</p>
              <ul className="text-muted-foreground">
                <li><strong>Public Key</strong>: Your wallet address (safe to share)</li>
                <li><strong>Secret Key</strong>: Your private key (never share this!)</li>
              </ul>

              <h3 className="text-base font-medium">Your Task</h3>
              <p className="text-muted-foreground">Write a function that:</p>
              <ol className="text-muted-foreground">
                <li>Generates a new random keypair</li>
                <li>Returns an object with the public key as a base58 string</li>
              </ol>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-1">Hints</p>
                    <ul className="text-sm text-muted-foreground list-disc ml-4">
                      <li>Use <code>Keypair.generate()</code> to create a new keypair</li>
                      <li>The public key has a <code>.toBase58()</code> method</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/courses/${lesson.courseSlug}/${lesson.previousLesson.id}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Link>
              </Button>
              <Button size="sm" asChild disabled={!allTestsPassed}>
                <Link href={`/courses/${lesson.courseSlug}/${lesson.nextLesson.id}`}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </aside>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor Toolbar */}
          <div className="h-12 border-b flex items-center px-4 gap-2 shrink-0 bg-background">
            <span className="text-sm font-medium">solution.ts</span>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetCode}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSolution(!showSolution)}
            >
              {showSolution ? "Hide Solution" : "Show Solution"}
            </Button>
            <Button
              onClick={runCode}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run Tests
            </Button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              theme="vs-dark"
              value={showSolution ? lesson.solutionCode : code}
              onChange={(value) => !showSolution && setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: showSolution,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                padding: { top: 16 }
              }}
            />
          </div>

          {/* Output Panel */}
          <div className="h-48 border-t shrink-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "output" | "tests")}>
              <div className="h-10 border-b flex items-center px-4">
                <TabsList className="h-8">
                  <TabsTrigger value="tests" className="text-xs h-6 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Tests
                    {testResults.some(t => t.passed) && (
                      <Badge variant="secondary" className="h-4 px-1 text-xs">
                        {testResults.filter(t => t.passed).length}/{testResults.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="output" className="text-xs h-6 gap-1">
                    <Terminal className="h-3 w-3" />
                    Output
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="tests" className="p-4 h-[calc(100%-2.5rem)] overflow-y-auto m-0">
                <div className="space-y-2">
                  {testResults.map((test, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm p-2 rounded ${
                        test.passed
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {test.passed ? (
                        <CheckCircle className="h-4 w-4 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0" />
                      )}
                      {test.name}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="output" className="p-4 h-[calc(100%-2.5rem)] overflow-y-auto m-0">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {output || "Run your code to see output..."}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {allTestsPassed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle>Lesson Complete!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                You&apos;ve successfully created your first Solana keypair!
              </p>
              <div className="flex items-center justify-center gap-2 text-lg font-medium">
                <Zap className="h-5 w-5 text-yellow-500" />
                +{lesson.xpReward} XP earned
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => setTestResults(lesson.tests)}>
                  Review Code
                </Button>
                <Button asChild>
                  <Link href={`/courses/${lesson.courseSlug}/${lesson.nextLesson.id}`}>
                    Next Lesson
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
