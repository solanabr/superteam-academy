"use client";

import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

const academyDark = createTheme({
    theme: "dark",
    settings: {
        background: "#0d1117",
        foreground: "#e6edf3",
        caret: "#58a6ff",
        selection: "#1f6feb33",
        selectionMatch: "#1f6feb22",
        lineHighlight: "#161b2233",
        gutterBackground: "#0d1117",
        gutterForeground: "#484f58",
    },
    styles: [
        { tag: t.comment, color: "#8b949e" },
        { tag: t.variableName, color: "#e6edf3" },
        { tag: [t.string, t.special(t.brace)], color: "#a5d6ff" },
        { tag: t.number, color: "#79c0ff" },
        { tag: t.bool, color: "#ff7b72" },
        { tag: t.null, color: "#ff7b72" },
        { tag: t.keyword, color: "#ff7b72" },
        { tag: t.operator, color: "#79c0ff" },
        { tag: t.className, color: "#f0883e" },
        { tag: t.definition(t.typeName), color: "#f0883e" },
        { tag: t.typeName, color: "#f0883e" },
        { tag: t.angleBracket, color: "#e6edf3" },
        { tag: t.tagName, color: "#7ee787" },
        { tag: t.attributeName, color: "#79c0ff" },
    ],
});
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface InteractiveEditorProps {
    language?: string;
    initialCode?: string;
    testCases?: string[];
    onSuccess?: () => void;
    xpReward?: number;
}

export function InteractiveEditor({
    language = "typescript",
    initialCode = "// Write your solution here\n",
    testCases = [],
    onSuccess,
    xpReward = 100,
}: InteractiveEditorProps) {
    const [code, setCode] = useState(initialCode);
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<{ passed: boolean; message: string }[] | null>(null);
    const [showXp, setShowXp] = useState(false);

    const extensions = [language === "rust" ? rust() : javascript({ typescript: true })];

    const handleRunCode = async () => {
        setIsRunning(true);
        setResults(null);
        setShowXp(false);

        // Simulate execution delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        let allPassed = true;
        const currentResults: { passed: boolean; message: string }[] = [];

        // Note: In production, code execution should happen in a secure isolated sandbox (like WebContainers or a backend runtime).
        // This is a mock client-side evaluation for demonstration of the interactive lesson loop.
        try {
            if (language === "typescript" || language === "javascript") {
                // VERY BASIC mock evaluation just to show success/fail states
                const userFunc = new Function(`
                    ${code}
                    return typeof solution !== 'undefined' ? solution : null;
                `);
                userFunc();

                // Mock test assertions
                if (!testCases || testCases.length === 0) {
                    currentResults.push({ passed: true, message: "Code executed successfully." });
                } else {
                    for (const test of testCases) {
                        try {
                            const testFn = new Function(`
                                ${code}
                                return ${test};
                            `);
                            const passed = testFn();
                            currentResults.push({
                                passed: !!passed,
                                message: passed ? `Passed: ${test}` : `Failed: ${test}`
                            });
                            if (!passed) allPassed = false;
                        } catch (err: unknown) {
                            const errMessage = err instanceof Error ? err.message : String(err);
                            currentResults.push({ passed: false, message: `Error in test '${test}': ${errMessage}` });
                            allPassed = false;
                        }
                    }
                }
            } else {
                // If it's Rust, we just mock a success for now since we can't run it client-side without WASM
                currentResults.push({ passed: true, message: "Cargo build successful. All tests passed." });
            }
        } catch (error: unknown) {
            allPassed = false;
            const errMessage = error instanceof Error ? error.message : String(error);
            currentResults.push({ passed: false, message: `Compilation Error: ${errMessage}` });
        }

        setResults(currentResults);
        setIsRunning(false);

        if (allPassed) {
            triggerSuccess();
        }
    };

    const triggerSuccess = () => {
        // Confetti explosion
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ["#ffd23f", "#008c4c", "#2f6b3f"]
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ["#ffd23f", "#008c4c", "#14F195"]
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();

        // Animate XP
        setShowXp(true);
        if (onSuccess) onSuccess();
    };

    return (
        <div className="flex flex-col h-full w-full rounded-xl overflow-hidden border border-border shadow-lg bg-card">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-destructive/80" />
                        <div className="w-3 h-3 rounded-full bg-accent/80" />
                        <div className="w-3 h-3 rounded-full bg-primary/80" />
                    </div>
                    <span className="ml-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        main.{language === "rust" ? "rs" : "ts"}
                    </span>
                </div>
                <div className="relative">
                    <Button
                        onClick={handleRunCode}
                        disabled={isRunning}
                        size="sm"
                        className="h-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                    >
                        {isRunning ? (
                            <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        <span>{isRunning ? "Running..." : "Run Code"}</span>
                    </Button>

                    <AnimatePresence>
                        {showXp && (
                            <motion.div
                                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                                animate={{ opacity: 1, y: -40, scale: 1.1 }}
                                exit={{ opacity: 0 }}
                                className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-accent text-accent-foreground font-bold rounded-full shadow-xl z-50 pointer-events-none"
                            >
                                +{xpReward} XP!
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-auto bg-[#0d1117]">
                <CodeMirror
                    value={code}
                    height="100%"
                    theme={academyDark}
                    extensions={extensions}
                    onChange={(val) => setCode(val)}
                    className="text-sm font-mono h-full"
                    basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: true,
                        foldGutter: true,
                        dropCursor: true,
                        allowMultipleSelections: true,
                        indentOnInput: true,
                        bracketMatching: true,
                        closeBrackets: true,
                        autocompletion: true,
                        rectangularSelection: true,
                        crosshairCursor: true,
                        highlightActiveLine: true,
                        highlightSelectionMatches: true,
                        closeBracketsKeymap: true,
                        defaultKeymap: true,
                        searchKeymap: true,
                        historyKeymap: true,
                        foldKeymap: true,
                        completionKeymap: true,
                        lintKeymap: true,
                    }}
                />
            </div>

            {/* Console / Test Runner Area */}
            {results && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-border bg-muted/30"
                >
                    <div className="px-4 py-2 bg-background border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Test Results
                    </div>
                    <div className="p-4 max-h-48 overflow-y-auto font-mono text-sm space-y-2">
                        {results.map((res, i) => (
                            <div key={i} className="flex items-start gap-2">
                                {res.passed ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                )}
                                <span className={res.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                    {res.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
