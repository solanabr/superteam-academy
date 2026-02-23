// app/src/components/code-editor.tsx
"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { useUser } from "@/hooks/useUser";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // Импорт для условных классов

interface CodeEditorProps {
  initialValue: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
  courseId: string;
  lessonIndex: number;
  readOnly?: boolean; // Новый проп
}

export function CodeEditor({ 
  initialValue, 
  language = "rust", 
  onChange,
  courseId,
  lessonIndex,
  readOnly = false, // Значение по умолчанию
}: CodeEditorProps) {
  const { saveCode } = useUser();
  const [code, setCode] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  // Debounced saving
  useEffect(() => {
    // Не сохраняем, если редактор в режиме чтения
    if (readOnly) return;
    
    const timer = setTimeout(async () => {
      if (code !== initialValue) {
        setSaving(true);
        await saveCode(courseId, lessonIndex, code);
        setSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, courseId, lessonIndex, saveCode, initialValue, readOnly]);

  const handleChange = (value: string | undefined) => {
    if (readOnly) return; // Блокируем изменения
    setCode(value || "");
    if (onChange) onChange(value);
  };

  return (
    <div className={cn(
        "h-full w-full relative border rounded-md overflow-hidden bg-[#1e1e1e]",
        readOnly && "cursor-not-allowed opacity-70" // Стили для заблокированного состояния
    )}>
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
          readOnly: readOnly, // Передаем проп в сам редактор
        }}
      />
    </div>
  );
}