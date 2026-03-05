"use client";

import { useRef, useEffect, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  minimap?: boolean;
}

export function CodeEditor({ value, onChange, language = "rust", readOnly = false, height = "100%", minimap = false }: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(height);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleChange = (val: string | undefined) => {
    if (onChange && val !== undefined) onChange(val);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateHeight = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          setEditorHeight(`${parent.clientHeight}px`);
        }
      }
    };

    updateHeight();
    
    const observer = new ResizeObserver(updateHeight);
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[200px]">
      <Editor
        height={editorHeight}
        language={language}
        value={value}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
        onChange={handleChange}
        onMount={handleMount}
        options={{ 
          minimap: { enabled: minimap }, 
          fontSize: 14, 
          readOnly,
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
