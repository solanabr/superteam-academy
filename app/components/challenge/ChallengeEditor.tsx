"use client";

import { autocompletion, completeFromList } from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";
import { rust } from "@codemirror/lang-rust";
import { search } from "@codemirror/search";
import { EditorView, keymap, type ViewUpdate } from "@codemirror/view";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";

/**
 * Solana-specific completions to make the editor feel more professional.
 */
const solanaCompletions = completeFromList([
	{ label: "Pubkey", type: "type", info: "Solana Public Key" },
	{ label: "AccountInfo", type: "type", info: "Solana Account Information" },
	{
		label: "ProgramResult",
		type: "type",
		info: "Result type for Solana programs",
	},
	{ label: "msg!", type: "function", info: "Log a message to the Solana logs" },
	{ label: "solana_program", type: "namespace" },
	{ label: "entrypoint!", type: "function", info: "Program entrypoint macro" },
	{
		label: "declare_id!",
		type: "function",
		info: "Declare the program ID (Anchor)",
	},
	{ label: "Program", type: "type", info: "Anchor Program type" },
	{ label: "Account", type: "type", info: "Anchor Account wrapper" },
	{ label: "Signer", type: "type", info: "Anchor Signer type" },
	{ label: "Ctx", type: "type", info: "Anchor Context" },
	{ label: "Accounts", type: "type", info: "Anchor Accounts trait" },
	{ label: "emit!", type: "function", info: "Emit a custom event (Anchor)" },
	{ label: "system_program", type: "namespace" },
	{ label: "sysvar", type: "namespace" },
	{ label: "solana_sdk", type: "namespace" },
	{ label: "BorshSerialize", type: "type" },
	{ label: "BorshDeserialize", type: "type" },
]);

interface ChallengeEditorProps {
	initialCode?: string;
	onChange?: (code: string) => void;
	fileName?: string;
	pagination?: string;
	isValidating?: boolean;
}

export function ChallengeEditor({
	initialCode = "",
	onChange,
	fileName = "src/lib.rs",
	pagination = "01 / 01",
	isValidating = false,
}: ChallengeEditorProps) {
	const [code, setCode] = useState(initialCode);
	const [cursor, setCursor] = useState({ line: 1, col: 1 });

	// Sync state with prop if it changes (e.g. reset)
	useEffect(() => {
		setCode(initialCode);
	}, [initialCode]);

	const handleChange = (value: string) => {
		setCode(value);
		if (onChange) onChange(value);
	};

	const handleUpdate = (update: ViewUpdate) => {
		if (update.selectionSet || update.docChanged) {
			const state = update.state;
			const pos = state.selection.main.head;
			const line = state.doc.lineAt(pos);
			setCursor({
				line: line.number,
				col: pos - line.from + 1,
			});
		}
	};

	return (
		<div className="flex flex-col h-full bg-[#1e1e1e] relative font-mono group">
			{/* Editor Header */}
			<div className="bg-ink-primary text-bg-base px-4 py-2 flex justify-between items-center text-[11px] font-mono border-b border-bg-base/20 shrink-0 z-10 transition-colors group-focus-within:border-bg-base/40">
				<div className="flex items-center gap-3">
					<span className="text-bg-base/50 font-bold">{pagination}</span>
					<span className="font-bold flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-orange-500/80 animate-pulse" />
						{fileName}
					</span>
				</div>
				<div className="flex items-center gap-4">
					{isValidating && (
						<span className="text-cyan-400 flex items-center gap-1 animate-pulse">
							<span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
							LOGICAL CHECK...
						</span>
					)}
					<span className="text-bg-base/70 uppercase tracking-widest text-[9px]">
						Auto-saving...
					</span>
				</div>
			</div>

			{/* Editor Body */}
			<div className="flex-1 relative bg-[#1e1e1e] min-h-0">
				<CodeMirror
					value={code}
					height="100%"
					theme={vscodeDark}
					onUpdate={handleUpdate}
					extensions={[
						rust(),
						search({ top: true }),
						keymap.of([indentWithTab]),
						autocompletion({
							activateOnTyping: true,
							override: [solanaCompletions],
						}),
						EditorView.theme({
							"&": { height: "100%" },
							".cm-scroller": { overflow: "auto" },
						}),
					]}
					onChange={handleChange}
					className="h-full text-[13px] leading-relaxed custom-codemirror"
					basicSetup={{
						lineNumbers: true,
						highlightActiveLine: true,
						bracketMatching: true,
						autocompletion: true,
						closeBrackets: true,
						foldGutter: true,
						dropCursor: true,
						allowMultipleSelections: true,
						indentOnInput: true,
						crosshairCursor: true,
						highlightSelectionMatches: true,
					}}
				/>
			</div>

			{/* Status Bar */}
			<div className="bg-[#007acc] text-white px-3 py-1 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider shrink-0 select-none">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-1.5">
						<span className="opacity-60">LN</span>
						<span>{cursor.line}</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="opacity-60">COL</span>
						<span>{cursor.col}</span>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-1.5">
						<span className="opacity-60">SPACES:</span>
						<span>4</span>
					</div>
					<div className="flex items-center gap-1.5 border-l border-white/20 pl-4 h-full">
						<span className="opacity-60">LANG:</span>
						<span>RUST</span>
					</div>
				</div>
			</div>

			<style jsx global>{`
				.custom-codemirror .cm-editor {
					background-color: #1e1e1e !important;
					height: 100%;
				}
				.custom-codemirror .cm-gutters {
					background-color: #1e1e1e !important;
					border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
					color: #858585 !important;
					padding-right: 8px;
				}
				.custom-codemirror .cm-activeLineGutter {
					background-color: rgba(255, 255, 255, 0.05) !important;
				}
				.custom-codemirror .cm-content {
					padding-top: 16px !important;
					padding-bottom: 16px !important;
				}
				/* Search Panel Styling */
				.cm-search {
					background-color: #252526 !important;
					border-bottom: 1px solid #454545 !important;
					color: #cccccc !important;
					padding: 8px 12px !important;
				}
				.cm-search input {
					background: #3c3c3c !important;
					border: 1px solid #3c3c3c !important;
					color: white !important;
					outline: none !important;
				}
				.cm-search button {
					background: #454545 !important;
					color: white !important;
					border: none !important;
					padding: 2px 8px !important;
					border-radius: 2px !important;
					margin: 0 2px !important;
				}
				.cm-search button:hover {
					background: #555555 !important;
				}
				/* Ensure Autocomplete Tooltip is visible and styled */
				.cm-tooltip.cm-tooltip-autocomplete {
					background-color: #252526 !important;
					border: 1px solid #454545 !important;
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
					z-index: 9999 !important;
				}
				.cm-tooltip-autocomplete ul li {
					padding: 6px 12px !important;
					font-size: 12px !important;
					font-family: monospace !important;
					color: #cccccc !important;
				}
				.cm-tooltip-autocomplete ul li[aria-selected] {
					background-color: #094771 !important;
					color: white !important;
				}
				.cm-completionDetail {
					font-style: italic;
					color: #858585;
					margin-left: 12px;
				}
				.custom-codemirror .cm-scroller {
					scrollbar-width: thin;
					scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
				}
				.custom-codemirror .cm-scroller::-webkit-scrollbar {
					width: 8px;
					height: 8px;
				}
				.custom-codemirror .cm-scroller::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-codemirror .cm-scroller::-webkit-scrollbar-thumb {
					background: rgba(255, 255, 255, 0.1);
					border-radius: 4px;
				}
				.custom-codemirror .cm-scroller::-webkit-scrollbar-thumb:hover {
					background: rgba(255, 255, 255, 0.2);
				}
			`}</style>
		</div>
	);
}
