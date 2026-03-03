"use client";

import { useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CodeEditorProps {
  showAiMentor?: boolean;
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  minimap?: boolean;
}

export function CodeEditor({ value, onChange, language = "rust", readOnly = false, height = "400px", minimap = false, showAiMentor = false }: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const t = useTranslations("codeEditor");
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const [aiExplanation, setAiExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleChange = (val: string | undefined) => {
    if (onChange && val !== undefined) onChange(val);
  };

  const runCode = async () => {
    const code = editorRef.current?.getValue() || value;
    setIsLoading(true);
    setAiExplanation("");
    setError("");
    try {
      const simulatedError = "error[E0425]: cannot find value in this scope";
      setError(simulatedError);
      const res = await fetch("/api/ai-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, error: simulatedError, locale }),
      });
      const data = await res.json();
      setAiExplanation(data.explanation);
    } catch (e) {
      setAiExplanation(t("aiFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg overflow-hidden border border-border">
        <Editor
          height={height}
          language={language}
          value={value}
          theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
          onChange={handleChange}
          onMount={handleMount}
          options={{ minimap: { enabled: minimap }, fontSize: 14, readOnly }}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={runCode} disabled={isLoading}>
          {isLoading ? t("running") : t("runCode")}
        </Button>
      </div>
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-mono">
          {error}
        </div>
      )}
      {aiExplanation && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{t("aiMentor")}</Badge>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{aiExplanation}</p>
        </div>
      )}
    </div>
  );
}