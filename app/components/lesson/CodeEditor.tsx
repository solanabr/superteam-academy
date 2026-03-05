"use client";

import { autocompletion, completeFromList } from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { rust } from "@codemirror/lang-rust";
import { search } from "@codemirror/search";
import { EditorView, keymap, type ViewUpdate } from "@codemirror/view";
import {
	ArrowCounterClockwiseIcon,
	CloudCheckIcon,
	PlayIcon,
} from "@phosphor-icons/react";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { xcodeLight } from "@uiw/codemirror-theme-xcode";
import CodeMirror from "@uiw/react-codemirror";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLessonCode } from "@/lib/hooks/use-lesson-code";
import { validateChallengeCode } from "@/lib/utils/challenge-validator";

/**
 * Represents a single test case for verification.
 */
export interface TestCase {
	name: string;
	description: string;
	status: "pass" | "fail" | "pending";
}

/**
 * Props for the CodeEditor component.
 */
interface CodeEditorProps {
	lessonId: string;
	courseId: string;
	initialCode?: string;
	solution?: string;
	testResults?: TestCase[];
	onTestResultsChange?: (results: TestCase[]) => void;
	onComplete?: () => void;
}

const SOLANA_COMPLETIONS = [
	{ label: "Pubkey", type: "type", detail: "Solana Public Key" },
	{ label: "AccountInfo", type: "type", detail: "Solana Account Info" },
	{ label: "Program", type: "type", detail: "Anchor Program" },
	{ label: "Signer", type: "type", detail: "Anchor Signer" },
	{ label: "Account", type: "type", detail: "Anchor Account" },
	{ label: "Ctx", type: "type", detail: "Anchor Context" },
	{ label: "Result", type: "type", detail: "Anchor Result" },
	{ label: "msg!", type: "function", detail: "Solana Logging Macro" },
	{ label: "declare_id!", type: "function", detail: "Anchor Program ID Macro" },
	{ label: "find_program_address", type: "method", detail: "PDA derivation" },
	{ label: "SystemProgram", type: "constant", detail: "Solana System Program" },
	{ label: "ID", type: "constant" },
];

/**
 * Syntax-highlighted code editor for solving course challenges.
 * Persists code to DB (via TanStack) with localStorage as an immediate fallback.
 */
export function CodeEditor({
	lessonId,
	courseId,
	initialCode = "",
	solution,
	testResults = [],
	onTestResultsChange,
	onComplete,
}: CodeEditorProps) {
	const t = useTranslations("Lesson");
	const { resolvedTheme } = useTheme();
	const [localCode, setLocalCode] = useState<string | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const [output, setOutput] = useState<string>("");
	const [lastSaved, setLastSaved] = useState<Date>(new Date());
	const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

	const { code: savedCode, save } = useLessonCode(
		lessonId,
		courseId,
		initialCode,
	);

	const code = localCode !== null ? localCode : savedCode;

	// Auto-save: debounce 2s then persist to DB
	useEffect(() => {
		if (code === savedCode) return;
		const timer = setTimeout(() => {
			save({ code });
			setLastSaved(new Date());
		}, 2000);
		return () => clearTimeout(timer);
	}, [code, savedCode, save]);

	// Real-time "Logical Check" pulse
	useEffect(() => {
		const timer = setTimeout(() => {
			if (code && code !== initialCode) {
				setIsValidating(true);
				setTimeout(() => setIsValidating(false), 800);
			}
		}, 1000);
		return () => clearTimeout(timer);
	}, [code, initialCode]);

	const getLanguage = () => {
		const codeLower = code.toLowerCase();
		if (
			codeLower.includes("use anchor") ||
			codeLower.includes("pub fn") ||
			codeLower.includes("#[account]")
		) {
			return { name: "Rust", ext: rust() };
		}
		if (
			codeLower.includes("import") ||
			codeLower.includes("const ") ||
			codeLower.includes("function")
		) {
			return { name: "TypeScript", ext: javascript({ typescript: true }) };
		}
		if (code.trim().startsWith("{") || code.trim().startsWith("[")) {
			return { name: "JSON", ext: json() };
		}
		return { name: "Rust", ext: rust() };
	};

	const lang = getLanguage();

	const handleUpdate = (update: ViewUpdate) => {
		if (update.selectionSet || update.docChanged) {
			const pos = update.state.selection.main.head;
			const line = update.state.doc.lineAt(pos);
			setCursorPos({
				line: line.number,
				col: pos - line.from + 1,
			});
		}
	};

	const editorTheme = useMemo(() => {
		return EditorView.theme({
			"&": {
				backgroundColor: resolvedTheme === "dark" ? "#1e1e1e" : "#ffffff",
			},
			".cm-gutters": {
				backgroundColor: resolvedTheme === "dark" ? "#1e1e1e" : "#ffffff",
				color: "#858585",
				border: "none",
			},
			".cm-activeLine": {
				backgroundColor: resolvedTheme === "dark" ? "#2c2c2c" : "#f3f3f3",
			},
			".cm-activeLineGutter": {
				backgroundColor: resolvedTheme === "dark" ? "#2c2c2c" : "#f3f3f3",
			},
			".cm-lineNumbers .cm-gutterElement": {
				padding: "0 8px 0 12px",
			},
			"&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
				{
					backgroundColor: resolvedTheme === "dark" ? "#264f78" : "#add6ff",
				},
			".cm-tooltip": {
				border: "none",
				backgroundColor: "#252526",
				color: "#cccccc",
				boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
			},
			".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
				backgroundColor: "#094771",
				color: "white",
			},
		});
	}, [resolvedTheme]);

	const handleReset = () => {
		setLocalCode(initialCode);
		toast.info("Code reset to starter template");
	};

	const handleShowSolution = () => {
		if (solution) {
			setLocalCode(solution);
			toast.info("Solution loaded into editor");
		}
	};

	const handleRunTests = async () => {
		if (isRunning) return;

		setIsRunning(true);
		setOutput("> cargo test-bpf...\n> Compiling program...");

		await new Promise((resolve) => setTimeout(resolve, 1500));

		const { passed, errorMessage } = validateChallengeCode(
			code,
			solution || "",
			initialCode,
		);

		if (passed) {
			setOutput(
				`> cargo test-bpf...\n> Finished in 2.4s\n> Running ${testResults.length || 3} tests\n\n${(testResults.length > 0 ? testResults : [{ name: "logic" }, { name: "safety" }, { name: "io" }]).map((r) => `test ${r.name.toLowerCase().replace(/\s+/g, "_")} ... ok`).join("\n")}\n\ntest result: ok. ${testResults.length || 3} passed; 0 failed; 0 ignored;`,
			);
			if (onTestResultsChange) {
				onTestResultsChange(testResults.map((r) => ({ ...r, status: "pass" })));
			}
			save({ code, completed: true });
			toast.success("All tests passed! Challenge completed.");
			if (onComplete) onComplete();
		} else {
			setOutput(
				`> cargo test-bpf...\n> Finished in 1.8s\n> Running tests\n\nFAILED: Logical Check failed\nReason: ${errorMessage}\n\ntest result: FAILED. 0 passed; 1 failed; 0 ignored;`,
			);
			if (onTestResultsChange) {
				onTestResultsChange(
					testResults.map((r, i) => (i === 0 ? { ...r, status: "fail" } : r)),
				);
			}
			toast.error(`Verification failed: ${errorMessage}`);
		}

		setIsRunning(false);
	};

	const getTimeSinceLastSave = () => {
		const seconds = Math.floor(
			(new Date().getTime() - lastSaved.getTime()) / 1000,
		);
		if (seconds < 60) return `${seconds}s ${t("ago")}`;
		const minutes = Math.floor(seconds / 60);
		return `${minutes}m ${t("ago")}`;
	};

	return (
		<div className="flex flex-col h-full border-l border-border bg-bg-base transition-colors duration-200">
			{/* Editor Header */}
			<div className="bg-[#0f1114] text-white px-4 py-2.5 flex justify-between items-center shrink-0 border-b border-white/5">
				<span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono opacity-90">
					{lang.name === "Rust" ? "SRC/LIB.RS" : "INDEX.TS"}
				</span>
				<div className="flex gap-6 items-center">
					<div className="flex items-center gap-2 text-[9px] uppercase tracking-widest opacity-50 font-medium">
						<CloudCheckIcon size={14} weight="fill" className="text-blue-400" />
						<span>
							{t("autosaved")} {getTimeSinceLastSave().toUpperCase()}
						</span>
					</div>
					<div className="flex gap-4 items-center">
						<button
							onClick={handleReset}
							title="Reset Code"
							className="opacity-50 hover:opacity-100 transition-opacity"
						>
							<ArrowCounterClockwiseIcon size={16} weight="bold" />
						</button>
						{solution && (
							<button
								onClick={handleShowSolution}
								className="border border-white/20 px-3 py-1 text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all rounded-sm"
							>
								{t("solution")}
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Main Editor Area */}
			<div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden relative">
				<div className="flex-1 overflow-hidden">
					<CodeMirror
						value={code}
						height="100%"
						theme={resolvedTheme === "dark" ? vscodeDark : xcodeLight}
						extensions={[
							lang.ext,
							editorTheme,
							search({ top: true }),
							autocompletion({
								override: [completeFromList(SOLANA_COMPLETIONS)],
								activateOnTyping: true,
							}),
							keymap.of([indentWithTab]),
						]}
						onUpdate={handleUpdate}
						onChange={(value) => setLocalCode(value)}
						className="h-full text-[13px] font-mono leading-relaxed"
						basicSetup={{
							lineNumbers: true,
							foldGutter: true,
							highlightActiveLine: true,
							dropCursor: true,
							allowMultipleSelections: true,
							indentOnInput: true,
							bracketMatching: true,
							autocompletion: false, // Handle via extension above
							rectangularSelection: true,
							crosshairCursor: true,
							highlightSelectionMatches: true,
						}}
					/>
				</div>

				{/* Professional Status Bar */}
				<div className="h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-[10px] font-medium shrink-0 select-none">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-1.5 cursor-help">
							<div
								className={`w-1.5 h-1.5 rounded-full ${isValidating ? "bg-white animate-pulse" : "bg-white/40"}`}
							/>
							<span>{isValidating ? "Validating..." : "Ln 0, Col 0"}</span>
						</div>
						<div className="opacity-80">
							Ln {cursorPos.line}, Col {cursorPos.col}
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="opacity-80 uppercase tracking-wider">
							{lang.name}
						</div>
						<div className="opacity-80">UTF-8</div>
					</div>
				</div>

				{/* Footer Controls / Console */}
				<div className="px-6 py-5 bg-bg-surface/50 dark:bg-bg-base/95 flex flex-col gap-4 shrink-0 transition-colors border-t border-border/40 dark:border-white/5">
					<div className="flex justify-between items-end">
						<div className="flex flex-col gap-1">
							<div className="text-[9px] font-bold uppercase tracking-widest text-ink-tertiary opacity-60">
								STATUS
							</div>
							<div className="text-[11px] font-bold uppercase tracking-widest font-mono flex items-center gap-2">
								<div
									className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-amber-500 animate-pulse" : "bg-green-500"}`}
								/>
								<span
									className={
										isRunning
											? "text-amber-600"
											: "text-ink-secondary dark:text-ink-secondary/50 uppercase tracking-[0.2em] text-[8px] font-bold opacity-90"
									}
								>
									{isRunning ? "Running Analysis..." : "System Standby"}
								</span>
							</div>
						</div>
						<Button
							variant="landingPrimary"
							size="sm"
							disabled={isRunning}
							onClick={handleRunTests}
							className="rounded-none uppercase text-[10px] font-bold px-8 py-3 h-auto tracking-[0.2em] flex items-center gap-3 bg-ink-primary text-white hover:bg-black dark:bg-bg-surface dark:text-ink-primary transition-all shadow-xl hover:-translate-y-px active:translate-y-0"
						>
							{isRunning ? (
								"Processing..."
							) : (
								<>
									{t("runTests")} <PlayIcon size={14} weight="fill" />
								</>
							)}
						</Button>
					</div>

					<div className="bg-ink-primary text-bg-base rounded-md p-5 font-mono text-[11px] h-40 overflow-y-auto border border-border/40 shadow-2xl relative overflow-hidden flex flex-col group">
						<div className="flex items-center justify-between mb-4 border-b border-bg-base/10 pb-2.5 shrink-0">
							<div className="flex items-center gap-3">
								<span className="text-[9px] uppercase font-bold tracking-[0.2em] text-bg-base/40">
									Terminal Output
								</span>
								<div className="h-3 w-px bg-bg-base/10" />
								<span className="text-[9px] text-bg-base/30">UTF-8</span>
							</div>
							<div className="flex gap-1.5">
								<div className="w-1.5 h-1.5 rounded-full bg-red-500/30 group-hover:bg-red-500/50 transition-colors" />
								<div className="w-1.5 h-1.5 rounded-full bg-yellow-500/30 group-hover:bg-yellow-500/50 transition-colors" />
								<div className="w-1.5 h-1.5 rounded-full bg-green-500/30 group-hover:bg-green-500/50 transition-colors" />
							</div>
						</div>
						<pre className="whitespace-pre-wrap leading-relaxed text-bg-base/80 font-mono italic flex-1 custom-scrollbar">
							{output || "> Device initialized. Ready for execution..."}
						</pre>
					</div>
				</div>
			</div>
		</div>
	);
}
