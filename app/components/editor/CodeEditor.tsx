/**
 * Code editor component — CodeMirror 6 wrapper.
 *
 * Provides syntax highlighting, basic autocompletion, and theming
 * for Rust, TypeScript, and JSON. Dynamically loaded to avoid SSR issues.
 */
'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
    language: 'rust' | 'typescript' | 'json';
    starterCode: string;
    isCompleted: boolean;
    isReadOnly?: boolean;
    onChange?: (code: string) => void;
}

/** Load language extension dynamically to reduce initial bundle */
async function getLanguageExtension(language: string): Promise<Extension> {
    switch (language) {
        case 'rust': {
            const { rust } = await import('@codemirror/lang-rust');
            return rust();
        }
        case 'typescript':
        case 'javascript': {
            const { javascript } = await import('@codemirror/lang-javascript');
            return javascript({ typescript: language === 'typescript', jsx: false });
        }
        case 'json': {
            const { json } = await import('@codemirror/lang-json');
            return json();
        }
        default: {
            const { rust } = await import('@codemirror/lang-rust');
            return rust();
        }
    }
}

export function CodeEditor({
    language,
    starterCode,
    isCompleted,
    isReadOnly = false,
    onChange,
}: CodeEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const initEditor = useCallback(async () => {
        if (!editorRef.current) return;

        // Destroy existing view
        if (viewRef.current) {
            viewRef.current.destroy();
            viewRef.current = null;
        }

        // Clear any orphaned DOM from previous mounts (React StrictMode)
        editorRef.current.innerHTML = '';

        const langExt = await getLanguageExtension(language);

        const extensions: Extension[] = [
            lineNumbers(),
            highlightActiveLineGutter(),
            history(),
            foldGutter(),
            indentOnInput(),
            bracketMatching(),
            closeBrackets(),
            autocompletion(),
            highlightActiveLine(),
            highlightSelectionMatches(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            oneDark,
            langExt,
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...searchKeymap,
                ...historyKeymap,
                indentWithTab,
            ]),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    onChangeRef.current?.(update.state.doc.toString());
                }
            }),
            EditorView.theme({
                '&': {
                    height: '100%',
                    fontSize: '14px',
                },
                '.cm-scroller': {
                    fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
                    lineHeight: '1.6',
                },
                '.cm-gutters': {
                    backgroundColor: 'transparent',
                    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                },
                '.cm-activeLineGutter': {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                },
            }),
        ];

        if (isCompleted || isReadOnly) {
            extensions.push(EditorState.readOnly.of(true));
        }

        const state = EditorState.create({
            doc: starterCode,
            extensions,
        });

        viewRef.current = new EditorView({
            state,
            parent: editorRef.current,
        });

        setIsLoading(false);
    }, [language, starterCode, isCompleted, isReadOnly]);

    useEffect(() => {
        initEditor();

        return () => {
            if (viewRef.current) {
                viewRef.current.destroy();
                viewRef.current = null;
            }
        };
    }, [initEditor]);

    /** Reset editor content to starter code */
    const resetCode = useCallback(() => {
        if (!viewRef.current) return;
        viewRef.current.dispatch({
            changes: {
                from: 0,
                to: viewRef.current.state.doc.length,
                insert: starterCode,
            },
        });
    }, [starterCode]);

    /** Get the current editor content */
    const getCode = useCallback((): string => {
        if (!viewRef.current) return starterCode;
        return viewRef.current.state.doc.toString();
    }, [starterCode]);

    // Expose reset and getCode via a custom attribute on the container
    useEffect(() => {
        if (editorRef.current) {
            (editorRef.current as HTMLDivElement & { __editorApi?: { resetCode: () => void; getCode: () => string } }).__editorApi = {
                resetCode,
                getCode,
            };
        }
    }, [resetCode, getCode]);

    return (
        <div className="code-editor-wrapper">
            {isLoading && (
                <div className="editor-loading">
                    <div className="editor-spinner" />
                </div>
            )}
            <div ref={editorRef} className="editor-container" />

            <style jsx>{`
                .code-editor-wrapper {
                    height: 100%;
                    position: relative;
                    background: #282c34;
                }
                .editor-container {
                    height: 100%;
                }
                .editor-container :global(.cm-editor) {
                    height: 100%;
                }
                .editor-loading {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #282c34;
                    z-index: 1;
                }
                .editor-spinner {
                    width: 24px;
                    height: 24px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-top-color: #9945FF;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
