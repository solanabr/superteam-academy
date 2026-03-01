"use client";

import { useRef, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "rust" | "typescript" | "json";
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "rust",
  readOnly = false,
  height = "400px",
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "JetBrains Mono, Fira Code, monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: "on",
      roundedSelection: false,
      padding: { top: 16, bottom: 16 },
      folding: true,
      renderLineHighlight: "line",
      matchBrackets: "always",
      autoIndent: "advanced",
      formatOnPaste: true,
      formatOnType: true,
      suggest: {
        showKeywords: true,
        showSnippets: true,
      },
    });

    // Add custom commands
    editor.addCommand(
      // Ctrl/Cmd + S to save
      (window as any).monaco?.KeyMod?.CtrlCmd | (window as any).monaco?.KeyCode?.KeyS,
      () => {
        // Auto-save is handled by parent component
        console.log("Save shortcut pressed");
      }
    );
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  if (!isMounted) {
    return (
      <div
        className="flex items-center justify-center bg-zinc-950 rounded-lg border border-white/10"
        style={{ height }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-white/10">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly,
          domReadOnly: readOnly,
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        }
      />
    </div>
  );
}

// Type definitions for Monaco editor
declare global {
  interface Window {
    monaco?: {
      KeyMod: {
        CtrlCmd: number;
      };
      KeyCode: {
        KeyS: number;
      };
    };
  }
}
