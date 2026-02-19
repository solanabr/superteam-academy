// app/src/components/code-editor.tsx
"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { useUser } from "@/hooks/useUser";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
  initialValue: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
  courseId: string;
  lessonIndex: number;
}

export function CodeEditor({ 
  initialValue, 
  language = "rust", 
  onChange,
  courseId,
  lessonIndex
}: CodeEditorProps) {
  const { saveCode } = useUser();
  const [code, setCode] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  // Debounce saving: сохраняем не чаще, чем раз в 2 секунды
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (code !== initialValue) {
        setSaving(true);
        await saveCode(courseId, lessonIndex, code);
        setSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, courseId, lessonIndex, saveCode, initialValue]);

  const handleChange = (value: string | undefined) => {
    setCode(value || "");
    if (onChange) onChange(value);
  };

  return (
    <div className="h-full w-full relative border rounded-md overflow-hidden bg-[#1e1e1e]">
      {saving && (
        <div className="absolute top-2 right-4 z-10 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
        </div>
      )}
      <Editor
        height="100%"
        defaultLanguage={language}
        theme="vs-dark"
        value={code}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}