"use client"

import { useState } from "react"
import Link from "next/link"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const starterCode = `use anchor_lang::prelude::*;

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
}`

const testCases = [
  { name: "Initializes counter to 0", passed: null as boolean | null },
  { name: "Sets correct authority", passed: null as boolean | null },
  { name: "Increments counter by 1", passed: null as boolean | null },
  { name: "Rejects unauthorized increment", passed: null as boolean | null },
]

export function CodeEditor({
  courseSlug,
  nextLessonId,
}: {
  courseSlug: string
  nextLessonId: string | null
}) {
  const [code, setCode] = useState(starterCode)
  const [output, setOutput] = useState("")
  const [running, setRunning] = useState(false)
  const [tests, setTests] = useState(testCases)
  const [completed, setCompleted] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")

  const handleRun = () => {
    setRunning(true)
    setOutput("")
    setActiveTab("output")

    // Simulate running
    setTimeout(() => {
      const allPassed = code.includes("count") && code.includes("authority")
      const results = tests.map((t, i) => ({
        ...t,
        passed: allPassed ? true : i < 2,
      }))
      setTests(results)

      if (allPassed) {
        setOutput(
          "Compiling program...\nDeploying to devnet...\nRunning test suite...\n\n✓ All tests passed!\n\nTransaction confirmed: Success\nProgram deployed at: 7xKY...9fGh"
        )
        setCompleted(true)
      } else {
        setOutput(
          "Compiling program...\nDeploying to devnet...\nRunning test suite...\n\n✗ 2 tests failed\n\nError: Counter not initialized correctly\n  Expected count: 0\n  Received: undefined"
        )
      }
      setRunning(false)
    }, 2000)
  }

  const handleReset = () => {
    setCode(starterCode)
    setTests(testCases.map((t) => ({ ...t, passed: null })))
    setOutput("")
    setCompleted(false)
  }

  return (
    <div className="flex h-full flex-col bg-[hsl(200,10%,7%)]">
      {/* Editor toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-border bg-card px-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground font-mono">
            counter.rs
          </Badge>
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
            Rust
          </Badge>
        </div>
        <div className="flex items-center gap-2">
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
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
            {tests.some((t) => t.passed !== null) && (
              <span className="ml-1.5 text-[10px]">
                ({tests.filter((t) => t.passed).length}/{tests.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
          <div className="h-full overflow-auto">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="code-editor w-full h-full min-h-[500px] bg-transparent p-4 text-sm text-foreground outline-none resize-none"
              spellCheck={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="output" className="flex-1 m-0 overflow-hidden">
          <div className="h-full overflow-auto p-4">
            {output ? (
              <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {output}
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
                {test.passed === null ? (
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                ) : test.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    test.passed === null
                      ? "text-muted-foreground"
                      : test.passed
                      ? "text-foreground"
                      : "text-destructive"
                  }`}
                >
                  {test.name}
                </span>
                {test.passed !== null && (
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
                <p className="text-sm font-semibold text-foreground">Challenge Complete!</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3 text-primary" /> +120 XP earned
                </p>
              </div>
            </div>
            {nextLessonId && (
              <Link href={`/courses/${courseSlug}/lessons/${nextLessonId}`}>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1">
                  Next Lesson
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
