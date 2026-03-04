"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import type { editor as MonacoEditorTypes } from "monaco-editor";

// Monaco must be lazy-loaded: it imports browser APIs that break SSR.
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[360px] bg-gray-950 text-gray-600 text-sm">
      Loading editor...
    </div>
  ),
});

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: EditorLanguage;
  fileName?: string;
  height?: string;
  onValidationChange?: (state: EditorValidationState) => void;
}

export type EditorLanguage = "javascript" | "typescript" | "rust" | "json";

export interface EditorValidationState {
  errorCount: number;
  warningCount: number;
  firstError: string | null;
}

const MARKER_SEVERITY_ERROR = 8;
const MARKER_SEVERITY_WARNING = 4;

export function Editor({
  value,
  onChange,
  language = "javascript",
  fileName = "solution.js",
  height = "360px",
  onValidationChange,
}: EditorProps) {
  const handleValidate = useCallback(
    (markers: MonacoEditorTypes.IMarker[]) => {
      if (!onValidationChange) return;

      const errorMarkers = markers.filter(
        (marker) => marker.severity === MARKER_SEVERITY_ERROR,
      );
      const warningMarkers = markers.filter(
        (marker) => marker.severity === MARKER_SEVERITY_WARNING,
      );

      onValidationChange({
        errorCount: errorMarkers.length,
        warningCount: warningMarkers.length,
        firstError: errorMarkers[0]?.message ?? null,
      });
    },
    [onValidationChange],
  );

  return (
    <MonacoEditor
      path={`file:///playground/${fileName}`}
      height={height}
      language={language}
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onValidate={handleValidate}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        padding: { top: 12, bottom: 12 },
      }}
    />
  );
}
