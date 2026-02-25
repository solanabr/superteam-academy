"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { setupMonacoTheme } from "@/lib/utils/monaco-theme";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[var(--c-bg)]">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--c-text-faint)]" />
    </div>
  ),
});

const MONACO_LANG_MAP: Record<string, string> = {
  rust: "rust",
  typescript: "typescript",
  javascript: "javascript",
  json: "json",
};

export function ChallengeEditor({
  code,
  onChange,
  language,
  fileName,
}: {
  code: string;
  onChange: (value: string) => void;
  language: string;
  fileName: string;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", height: 34, background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 12px", flexShrink: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.8)", padding: "7px 14px", position: "relative" as const }}>
          {fileName}
          <div style={{ position: "absolute" as const, bottom: -1, left: 10, right: 10, height: 2, background: "var(--nd-highlight-orange)" }} />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: "relative" as const }}>
        <MonacoEditor
          height="100%"
          language={MONACO_LANG_MAP[language] ?? "typescript"}
          theme="academy"
          value={code}
          onChange={(v) => onChange(v ?? "")}
          beforeMount={setupMonacoTheme}
          options={{
            minimap: { enabled: false },
            fontSize: 12.5,
            fontFamily: "var(--font-mono)",
            padding: { top: 14, bottom: 14 },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            smoothScrolling: true,
            cursorSmoothCaretAnimation: "on",
            cursorBlinking: "smooth",
            renderLineHighlight: "line",
            lineHeight: 21,
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            wordBasedSuggestions: "currentDocument",
            formatOnPaste: true,
            tabCompletion: "on",
          }}
        />
      </div>
    </>
  );
}
