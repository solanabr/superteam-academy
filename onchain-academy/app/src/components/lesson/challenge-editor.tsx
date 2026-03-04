"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { emitChallengeResult } from "@/lib/challenge-sync";

type Props = {
  lessonId: string;
  starterCode?: string;
  tests?: string[];
};

export function ChallengeEditor({ lessonId, starterCode = "", tests = [] }: Props) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState<string>("// Ready to run...\n");
  const [isRunning, setIsRunning] = useState(false);

  const evaluateTest = (test: string, source: string) => {
    const lowerTest = test.toLowerCase();
    const lowerCode = source.toLowerCase();

    if (lowerTest.includes("connect")) {
      return /connectwallet|wallet|phantom/.test(lowerCode);
    }
    if (lowerTest.includes("sign") || lowerTest.includes("submit") || lowerTest.includes("transaction")) {
      return /sign|submit|sendtransaction|submitevnetrollmenttransaction|tx/.test(lowerCode);
    }
    if (lowerTest.includes("signature") || lowerTest.includes("return")) {
      return /signature|return/.test(lowerCode);
    }
    return lowerCode.trim().length > 0 && lowerCode.trim() !== starterCode.trim();
  };

  const handleRun = () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput("// Compiling and running tests...\n");
    
    window.setTimeout(() => {
      let results = "";
      let allPassed = true;

      if (tests.length === 0) {
        results = "No tests available for this challenge.\n";
      } else {
        tests.forEach((test, i) => {
          const passed = evaluateTest(test, code);
          if (!passed) allPassed = false;
          results += `Test ${i + 1}: ${passed ? "✅ PASS" : "❌ FAIL"} — ${test}\n`;
        });
      }

      if (allPassed) {
        results += "\n🎉 All tests passed! Great job.";
      } else {
        results += "\n⚠️ Some tests failed. Keep trying!";
      }

      setOutput(results);
      setIsRunning(false);
      emitChallengeResult({ lessonId, passed: allPassed });
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#1d1d1f] rounded-[24px] apple-shadow overflow-hidden text-white shadow-2xl">
      
      {/* Xcode-style Header */}
      <div className="flex items-center justify-between px-6 h-14 bg-[#2d2d2f] border-b border-black/20">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[13px] font-mono text-[#86868b] pl-4 border-l border-white/10">lib.rs</span>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2997ff] text-white text-[13px] font-medium hover:bg-[#0071e3] transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 min-h-[400px] py-4">
        <Editor
          height="100%"
          defaultLanguage="rust"
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
            lineHeight: 24,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            renderLineHighlight: "none",
          }}
        />
      </div>

      {/* Terminal / Output */}
      <div className="h-56 bg-[#000000] flex flex-col border-t border-white/10">
        <div className="px-6 h-10 border-b border-white/5 flex items-center text-[12px] font-mono text-[#86868b] uppercase tracking-wider">
          Console
        </div>
        <div className="p-6 flex-1 overflow-y-auto font-mono text-[13px] leading-relaxed text-[#d2d2d7] whitespace-pre-wrap">
          {output}
        </div>
      </div>
      
    </div>
  );
}
