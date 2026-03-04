"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";
import { Button } from "@/components/ui/button";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type SupportedLanguage = "typescript" | "javascript" | "rust" | "solidity" | "go" | "json";

type CodeEditorProps = {
  storageKey: string;
  language: SupportedLanguage;
  initialCode?: string;
  onChange?: (code: string) => void;
};

export function CodeEditor({ storageKey, language, initialCode = "", onChange }: CodeEditorProps) {
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    if (stored !== null) {
      setCode(stored);
    } else {
      setCode(initialCode);
    }
  }, [storageKey, initialCode]);

  const handleChange = (value: string | undefined) => {
    const next = value ?? "";
    setCode(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, next);
    }
    onChange?.(next);
  };

  const handleRunLocally = () => {
    if (language !== "javascript" && language !== "typescript") {
      setOutput("Local run is only supported for JavaScript/TypeScript.");
      return;
    }

    try {
      const logs: string[] = [];
      const originalLog = console.log;
      // eslint-disable-next-line no-console
      console.log = (...args: unknown[]) => {
        logs.push(args.map(String).join(" "));
      };
      // eslint-disable-next-line no-new-func
      const fn = new Function(code);
      fn();
      // eslint-disable-next-line no-console
      console.log = originalLog;
      setOutput(logs.join("\n") || "[no output]");
    } catch (err) {
      setOutput(err instanceof Error ? err.message : "Execution error");
    }
  };

  return (
    <div className="h-full max-h-[70%] border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase text-muted-foreground">Editor</span>
        <Button size="xs" variant="outline" className="rounded-none" onClick={handleRunLocally}>
          Run Code
        </Button>
      </div>
      <div className="h-full">
        <Monaco
          height="95%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          } as editor.IStandaloneEditorConstructionOptions}
        />
      </div>
      {output && (
        <div className="mt-3 border border-border bg-background p-2 text-xs font-mono whitespace-pre-wrap">
          {output}
        </div>
      )}
    </div>
  );
}

