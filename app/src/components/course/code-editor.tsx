"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, CheckCircle2 } from "lucide-react";

interface CodeEditorProps {
  initialCode: string;
  language?: string;
}

export function CodeEditor({
  initialCode,
  language = "rust",
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [passed, setPassed] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");

    // Simulated execution
    await new Promise((r) => setTimeout(r, 1500));

    setOutput(
      `Compiling program...\nBuild successful.\n\nRunning tests...\n  test_initialize ... ok\n  test_counter_increment ... ok\n\nAll 2 tests passed.`
    );
    setPassed(true);
    setIsRunning(false);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput("");
    setPassed(false);
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-2">
            main.{language === "rust" ? "rs" : "ts"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className={passed ? "bg-solana-green hover:bg-solana-green/90 text-black" : ""}
          >
            {isRunning ? (
              <span className="flex items-center gap-1">
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running...
              </span>
            ) : passed ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Passed
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Play className="h-3.5 w-3.5" />
                Run
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setPassed(false);
          }}
          className="w-full h-80 bg-[#0d1117] text-[#e6edf3] font-mono text-sm p-4 resize-none focus:outline-none leading-6"
          spellCheck={false}
        />
      </div>

      {output && (
        <div className="border-t bg-[#0d1117] p-4">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Output</div>
          <pre
            className={`font-mono text-xs whitespace-pre-wrap ${
              passed ? "text-solana-green" : "text-[#e6edf3]"
            }`}
          >
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
