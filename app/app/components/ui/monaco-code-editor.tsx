"use client";

import { useRef, useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
// import type { editor } from "monaco-editor";
import { Loader2 } from "lucide-react";

interface MonacoCodeEditorProps {
    code: string;
    language?: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
}

export function MonacoCodeEditor({
    code,
    language = "typescript",
    onChange,
    readOnly = false,
}: MonacoCodeEditorProps) {
    const editorRef = useRef<any>(null);

    const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
        // Define custom theme on mount (client-side only)
        monaco.editor.defineTheme("solana-hacker-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
                { token: "", foreground: "d4d4d4", background: "050810" },
                { token: "comment", foreground: "4a5568", fontStyle: "italic" },
                { token: "keyword", foreground: "00ffa3" },
                { token: "string", foreground: "00e5ff" },
                { token: "number", foreground: "b794f4" },
                { token: "type", foreground: "00e5ff" },
                { token: "function", foreground: "d4d4d4" },
                { token: "variable", foreground: "d4d4d4" },
                { token: "constant", foreground: "b794f4" },
                { token: "operator", foreground: "00ffa3" },
                { token: "delimiter", foreground: "6b7280" },
            ],
            colors: {
                "editor.background": "#050810",
                "editor.foreground": "#d4d4d4",
                "editor.lineHighlightBackground": "#0a0f1a",
                "editor.selectionBackground": "#00ffa31a",
                "editor.inactiveSelectionBackground": "#00ffa30d",
                "editorCursor.foreground": "#00ffa3",
                "editorLineNumber.foreground": "#2d3748",
                "editorLineNumber.activeForeground": "#00ffa3",
                "editorIndentGuide.background": "#1a1f2e",
                "editorIndentGuide.activeBackground": "#2d3748",
                "editor.selectionHighlightBackground": "#00ffa30d",
                "editorBracketMatch.background": "#00ffa31a",
                "editorBracketMatch.border": "#00ffa340",
                "editorGutter.background": "#050810",
                "editorWidget.background": "#0a0f1a",
                "editorWidget.border": "#1a1f2e",
                "input.background": "#0a0f1a",
                "input.border": "#1a1f2e",
                "scrollbarSlider.background": "#ffffff0d",
                "scrollbarSlider.hoverBackground": "#ffffff1a",
                "scrollbarSlider.activeBackground": "#00ffa333",
            },
        });
        monaco.editor.setTheme("solana-hacker-dark");

        editorRef.current = editor;
        editor.focus();
    }, []);

    const handleChange = useCallback(
        (value: string | undefined) => {
            if (onChange && value !== undefined) {
                onChange(value);
            }
        },
        [onChange]
    );

    return (
        <div className="w-full h-full relative group overflow-hidden">
            {/* Corner brackets */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green/20 z-10 pointer-events-none" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-green/20 z-10 pointer-events-none" />

            <Editor
                height="100%"
                language={language}
                value={code}
                theme="solana-hacker-dark"
                onChange={handleChange}
                onMount={handleEditorDidMount}
                loading={
                    <div className="flex items-center justify-center h-full bg-[#050810]">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-5 h-5 text-neon-green/40 animate-spin" />
                            <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                                Loading Editor…
                            </span>
                        </div>
                    </div>
                }
                options={{
                    readOnly,
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                    fontLigatures: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    lineNumbers: "on",
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 8,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: "line",
                    renderWhitespace: "none",
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    smoothScrolling: true,
                    contextmenu: true,
                    wordWrap: "on",
                    tabSize: 2,
                    bracketPairColorization: {
                        enabled: true,
                    },
                    scrollbar: {
                        verticalScrollbarSize: 6,
                        horizontalScrollbarSize: 6,
                        verticalSliderSize: 6,
                    },
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                }}
            />
        </div>
    );
}
