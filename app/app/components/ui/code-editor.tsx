"use client";

import { useRef, useEffect, useMemo } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import {
    EditorView,
    keymap,
    lineNumbers,
    highlightActiveLine,
    highlightActiveLineGutter,
    drawSelection,
    rectangularSelection,
} from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { json } from "@codemirror/lang-json";
import {
    syntaxHighlighting,
    HighlightStyle,
    indentOnInput,
    bracketMatching,
    foldGutter,
    foldKeymap,
} from "@codemirror/language";
import {
    closeBrackets,
    closeBracketsKeymap,
    autocompletion,
    completionKeymap,
} from "@codemirror/autocomplete";
import {
    defaultKeymap,
    history,
    historyKeymap,
    indentWithTab,
} from "@codemirror/commands";
import { linter, lintGutter, Diagnostic } from "@codemirror/lint";
import { tags as t } from "@lezer/highlight";

/* ── Custom hacker theme ──────────────────────────────── */
const hackerTheme = EditorView.theme(
    {
        "&": {
            color: "#c9d1d9",
            backgroundColor: "transparent",
            fontSize: "13px",
            fontFamily:
                "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace",
        },
        ".cm-content": {
            caretColor: "#00ffa3",
            padding: "16px 0",
            lineHeight: "1.7",
        },
        "&.cm-focused .cm-cursor": {
            borderLeftColor: "#00ffa3",
            borderLeftWidth: "2px",
        },
        "&.cm-focused .cm-selectionBackground, ::selection": {
            backgroundColor: "#00ffa31a !important",
        },
        ".cm-selectionBackground": {
            backgroundColor: "#00ffa30d !important",
        },
        ".cm-activeLine": {
            backgroundColor: "#ffffff05",
        },
        ".cm-gutters": {
            backgroundColor: "transparent",
            color: "#2a3040",
            border: "none",
            paddingRight: "4px",
        },
        ".cm-activeLineGutter": {
            backgroundColor: "transparent",
            color: "#00ffa380",
        },
        ".cm-lineNumbers .cm-gutterElement": {
            padding: "0 8px 0 16px",
            minWidth: "36px",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
        },
        ".cm-foldGutter .cm-gutterElement": {
            padding: "0 4px",
            color: "#2a3040",
            cursor: "pointer",
            transition: "color 0.15s",
        },
        ".cm-foldGutter .cm-gutterElement:hover": {
            color: "#00ffa3",
        },
        /* Bracket matching */
        ".cm-matchingBracket": {
            backgroundColor: "#00ffa315",
            color: "#00ffa3 !important",
            outline: "1px solid #00ffa330",
        },
        "&.cm-focused .cm-matchingBracket": {
            backgroundColor: "#00ffa320",
        },
        /* Tooltips / autocomplete */
        ".cm-tooltip": {
            backgroundColor: "#0d1117",
            border: "1px solid #ffffff15",
            borderRadius: "0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        },
        ".cm-tooltip-autocomplete": {
            "& > ul > li": {
                padding: "4px 8px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
            },
            "& > ul > li[aria-selected]": {
                backgroundColor: "#00ffa315",
                color: "#c9d1d9",
            },
        },
        /* Search */
        ".cm-searchMatch": {
            backgroundColor: "#e2b71440",
            outline: "1px solid #e2b71460",
        },
        ".cm-searchMatch.cm-searchMatch-selected": {
            backgroundColor: "#e2b71460",
        },
        /* Lint / error markers */
        ".cm-lintRange-error": {
            backgroundImage: "none",
            borderBottom: "2px wavy #f8514980",
        },
        ".cm-lintRange-warning": {
            backgroundImage: "none",
            borderBottom: "2px wavy #e3b34180",
        },
        ".cm-lintRange-info": {
            backgroundImage: "none",
            borderBottom: "1px dashed #79c0ff60",
        },
        ".cm-lint-marker-error": {
            content: '"●"',
            color: "#f85149",
        },
        ".cm-lint-marker-warning": {
            content: '"●"',
            color: "#e3b341",
        },
        ".cm-diagnostic": {
            backgroundColor: "#0d1117",
            border: "1px solid #ffffff10",
            padding: "8px 12px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
        },
        ".cm-diagnostic-error": {
            borderLeft: "3px solid #f85149",
        },
        ".cm-diagnostic-warning": {
            borderLeft: "3px solid #e3b341",
        },
        /* Scrollbar */
        ".cm-scroller": {
            overflow: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#ffffff10 transparent",
        },
        ".cm-scroller::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
        },
        ".cm-scroller::-webkit-scrollbar-track": {
            background: "transparent",
        },
        ".cm-scroller::-webkit-scrollbar-thumb": {
            backgroundColor: "#ffffff10",
            borderRadius: "3px",
        },
        ".cm-scroller::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#ffffff20",
        },
    },
    { dark: true }
);

/* ── Syntax colors ────────────────────────────────────── */
const hackerHighlight = HighlightStyle.define([
    { tag: t.keyword, color: "#ff7b72" },
    { tag: t.controlKeyword, color: "#ff7b72", fontWeight: "bold" },
    { tag: t.operatorKeyword, color: "#ff7b72" },
    { tag: t.definitionKeyword, color: "#ff7b72" },
    { tag: t.moduleKeyword, color: "#ff7b72" },
    { tag: [t.name], color: "#c9d1d9" },
    { tag: t.definition(t.variableName), color: "#79c0ff" },
    { tag: t.function(t.variableName), color: "#d2a8ff" },
    { tag: t.definition(t.function(t.variableName)), color: "#d2a8ff", fontWeight: "bold" },
    { tag: [t.propertyName], color: "#79c0ff" },
    { tag: t.definition(t.propertyName), color: "#79c0ff" },
    { tag: [t.typeName], color: "#00ffa3" },
    { tag: [t.className], color: "#00ffa3" },
    { tag: [t.string], color: "#a5d6ff" },
    { tag: t.special(t.string), color: "#a5d6ff" },
    { tag: [t.number], color: "#79c0ff" },
    { tag: [t.bool], color: "#79c0ff" },
    { tag: [t.null], color: "#79c0ff" },
    { tag: [t.regexp], color: "#a5d6ff" },
    { tag: [t.comment], color: "#3d4f5f", fontStyle: "italic" },
    { tag: [t.lineComment], color: "#3d4f5f", fontStyle: "italic" },
    { tag: [t.blockComment], color: "#3d4f5f", fontStyle: "italic" },
    { tag: [t.docComment], color: "#4d6f5f", fontStyle: "italic" },
    { tag: [t.operator], color: "#ff7b72" },
    { tag: [t.punctuation], color: "#6e7681" },
    { tag: [t.paren], color: "#8b949e" },
    { tag: [t.bracket], color: "#8b949e" },
    { tag: [t.brace], color: "#8b949e" },
    { tag: [t.meta], color: "#6e7681" },
    { tag: [t.invalid], color: "#f85149" },
    /* Rust-specific: macros, lifetimes, attributes */
    { tag: [t.macroName], color: "#79c0ff", fontWeight: "bold" },
    { tag: [t.attributeName], color: "#d2a8ff" },
    { tag: [t.labelName], color: "#ffa657" },
    { tag: [t.self], color: "#ff7b72", fontStyle: "italic" },
]);

/* ── Helpers ──────────────────────────────────────────── */
function getLanguageExtension(lang: string) {
    switch (lang) {
        case "rust":
            return rust();
        case "json":
            return json();
        case "javascript":
            return javascript({ jsx: true });
        case "typescript":
        default:
            return javascript({ typescript: true, jsx: true });
    }
}

/* ── Types ────────────────────────────────────────────── */
export interface EditorError {
    line: number;
    message: string;
    severity: "error" | "warning" | "info";
}

interface CodeEditorProps {
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    language?: "typescript" | "javascript" | "rust" | "json";
    errors?: EditorError[];
}

/* ── Component ────────────────────────────────────────── */
export default function CodeEditor({
    value,
    onChange,
    readOnly = false,
    language = "typescript",
    errors = [],
}: CodeEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    const errorsRef = useRef(errors);
    const langCompartment = useRef(new Compartment());
    const lintCompartment = useRef(new Compartment());

    // Keep refs in sync
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        errorsRef.current = errors;
    }, [errors]);

    // Create editor on mount
    useEffect(() => {
        if (!containerRef.current) return;

        const updateListener = EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                onChangeRef.current?.(update.state.doc.toString());
            }
        });

        const errorLinter = linter((view) => {
            const diagnostics: Diagnostic[] = [];
            const errs = errorsRef.current;
            for (const err of errs) {
                const lineNum = Math.min(err.line, view.state.doc.lines);
                const line = view.state.doc.line(lineNum);
                diagnostics.push({
                    from: line.from,
                    to: line.to,
                    severity: err.severity,
                    message: err.message,
                });
            }
            return diagnostics;
        });

        const state = EditorState.create({
            doc: value,
            extensions: [
                // Core editing
                lineNumbers(),
                highlightActiveLine(),
                highlightActiveLineGutter(),
                drawSelection(),
                rectangularSelection(),
                indentOnInput(),
                history(),
                foldGutter(),
                bracketMatching(),
                closeBrackets(),
                autocompletion(),

                // Language (in compartment for dynamic switching)
                langCompartment.current.of(getLanguageExtension(language)),

                // Lint / errors (in compartment for dynamic updates)
                lintCompartment.current.of(errorLinter),
                lintGutter(),

                // Theme
                hackerTheme,
                syntaxHighlighting(hackerHighlight),

                // Keymaps
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...historyKeymap,
                    ...foldKeymap,
                    ...completionKeymap,
                    indentWithTab,
                ]),

                // Controlled
                updateListener,
                EditorState.readOnly.of(readOnly),
                EditorView.editable.of(!readOnly),

                EditorView.contentAttributes.of({
                    "aria-label": "Code editor",
                }),
            ],
        });

        const view = new EditorView({
            state,
            parent: containerRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync external value changes (e.g. reset code)
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const currentValue = view.state.doc.toString();
        if (value !== currentValue) {
            view.dispatch({
                changes: {
                    from: 0,
                    to: currentValue.length,
                    insert: value,
                },
            });
        }
    }, [value]);

    // Switch language dynamically
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch({
            effects: langCompartment.current.reconfigure(
                getLanguageExtension(language)
            ),
        });
    }, [language]);

    // Force re-lint when errors change
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;

        const errorLinter = linter((v) => {
            const diagnostics: Diagnostic[] = [];
            for (const err of errors) {
                const lineNum = Math.min(Math.max(1, err.line), v.state.doc.lines);
                const line = v.state.doc.line(lineNum);
                diagnostics.push({
                    from: line.from,
                    to: line.to,
                    severity: err.severity,
                    message: err.message,
                });
            }
            return diagnostics;
        });

        view.dispatch({
            effects: lintCompartment.current.reconfigure(errorLinter),
        });
    }, [errors]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-hidden"
            style={{ minHeight: 0 }}
        />
    );
}
