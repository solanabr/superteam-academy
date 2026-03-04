"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic";


const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading editor...
      </div>
    ),
  }
);

interface LessonEditorProps {
  lessonType?: "content" | "challenge"
  starterCode?: string
  challenge?: {
    functionName: string
    expectedReturn: string | boolean | number
  }
  onPass?: () => void
}

export function LessonEditor({
  lessonType,
  starterCode,
  challenge,
  onPass,
}: LessonEditorProps) {

  const [code, setCode] = useState(starterCode ?? "")
  const [output, setOutput] = useState("")
  const [status, setStatus] = useState<
    "idle" | "running" | "pass" | "fail"
  >("idle")

  useEffect(() => {
    setCode(starterCode ?? "")
    setStatus("idle")
    setOutput("")
  }, [starterCode])

  useEffect(() => {
    if (status === "pass") {
      setStatus("idle")
      setOutput("")
    }
  }, [code]) // eslint-disable-line

  const handleRun = () => {
    if (!challenge) return

    setStatus("running")

    setTimeout(() => {
      try {
        // Create a safe function wrapper
        const userFunction = new Function(`
        "use strict";
        ${code}
        if (typeof ${challenge.functionName} !== "function") {
            throw new Error("Function ${challenge.functionName} not found");
        }
        return ${challenge.functionName}();
        `)

        const result = userFunction()

        if (result === challenge.expectedReturn) {
          setStatus("pass")
          setOutput(`✅ Returned: ${String(result)}`)
          onPass?.()
        } else {
          setStatus("fail")
          setOutput(
            `❌ Expected ${String(challenge.expectedReturn)}, but got ${String(result)}`
          )
        }
      } catch (error: any) {
        setStatus("fail")
        setOutput(`❌ Runtime Error: ${error.message}`)
      }
    }, 500)
  }

  return (
    <Card className="h-full flex flex-col p-6 gap-6 shadow-sm rounded-2xl">

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">Editor</h2>

          {lessonType === "challenge" && (
            <Badge variant="secondary">
              Challenge Mode
            </Badge>
          )}
        </div>

        {lessonType === "challenge" && (
          <Button
            onClick={handleRun}
            disabled={status === "running"}
          >
            {status === "running" ? "Running..." : "Run Code"}
          </Button>
        )}
      </div>

      <div className="flex-1 rounded-lg overflow-hidden border bg-background p-1">
        <MonacoEditor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            theme="vs-dark"
            options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            }}
        />
      </div>

      {lessonType === "challenge" && (
        <div className="rounded-lg bg-muted/60 border p-4 text-sm font-mono min-h-[70px]">
          {output || "Output will appear here..."}
        </div>
      )}

      {lessonType === "challenge" && status !== "idle" && (
        <div className="text-sm font-medium">
          {status === "pass" && (
            <span className="text-green-600">Status: Passed</span>
          )}
          {status === "fail" && (
            <span className="text-red-600">Status: Failed</span>
          )}
        </div>
      )}

    </Card>
  )
}