"use client";

import { Loader2, Play, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Loading editor...
          </span>
        </div>
      </div>
    ),
  },
);

export interface EditorPanelProps {
  code: string;
  language: "rust" | "typescript" | "json";
  editorLanguage: string;
  isRunning: boolean;
  onCodeChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  compact?: boolean;
}

function getFileName(language: "rust" | "typescript" | "json"): string {
  switch (language) {
    case "rust":
      return "main.rs";
    case "json":
      return "config.json";
    default:
      return "solution.ts";
  }
}

export function EditorPanel({
  code,
  language,
  editorLanguage,
  isRunning,
  onCodeChange,
  onRun,
  onReset,
  compact = false,
}: EditorPanelProps) {
  const t = useTranslations("lesson");
  const fontSize = compact ? 13 : 14;
  const padding = compact ? { top: 12, bottom: 12 } : { top: 16, bottom: 16 };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#1e1e1e]">
      <div
        className={cn(
          "flex items-center justify-between border-b border-[#333]",
          compact ? "px-3 py-1.5" : "px-4 py-2",
        )}
      >
        {compact ? (
          <span className="text-xs text-[#888]">{language}</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#ccc]">
              {getFileName(language)}
            </span>
            <span className="rounded bg-[#333] px-1.5 py-0.5 text-[10px] uppercase text-[#888]">
              {language}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {compact ? (
            <button
              onClick={onReset}
              className="rounded p-1 text-[#888] hover:bg-[#333] hover:text-[#ccc]"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={onReset}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#888] transition-colors hover:bg-[#333] hover:text-[#ccc]"
              title={t("editor.resetToStarter")}
            >
              <RotateCcw className="h-3 w-3" /> {t("editor.reset")}
            </button>
          )}
          <button
            onClick={onRun}
            disabled={isRunning}
            className={cn(
              "flex items-center gap-1 rounded text-xs font-medium transition-all",
              compact ? "px-2 py-1" : "gap-1.5 rounded-md px-3 py-1.5",
              isRunning
                ? "bg-[#333] text-[#888]"
                : "bg-brazil-green text-white hover:bg-brazil-green/90",
            )}
          >
            {isRunning ? (
              <>
                <Loader2
                  className={cn(
                    "animate-spin",
                    compact ? "h-3 w-3" : "h-3 w-3",
                  )}
                />
                {compact ? t("editor.run") : t("editor.running")}
              </>
            ) : (
              <>
                <Play className={compact ? "h-3 w-3" : "h-3 w-3"} />
                {compact ? t("editor.run") : t("runCode")}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={editorLanguage}
          theme="vs-dark"
          value={code}
          onChange={(value: string | undefined) => onCodeChange(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            padding,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            ...(compact
              ? {}
              : {
                  suggest: { showKeywords: true },
                  bracketPairColorization: { enabled: true },
                }),
          }}
        />
      </div>
    </div>
  );
}
