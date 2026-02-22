"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface Challenge {
	id: string;
	title: string;
	language: string;
	starterCode: string;
	tests: Array<{
		id: string;
		description: string;
		type: "unit" | "integration";
	}>;
}

interface ChallengeEditorProps {
	challenge: Challenge;
	initialCode: string;
	onCodeChange: (code: string) => void;
	onRunTests: () => void;
	onSubmit: () => void;
}

export function ChallengeEditor({
	challenge,
	initialCode,
	onCodeChange,
	onRunTests,
	onSubmit,
}: ChallengeEditorProps) {
	const t = useTranslations("challenges");
	const [code, setCode] = useState(initialCode);
	const [isRunning, setIsRunning] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (code !== initialCode) {
			setCode(initialCode);
		}
	}, [initialCode, code]);

	const handleCodeChange = (value: string | undefined) => {
		const newCode = value || "";
		setCode(newCode);
		onCodeChange(newCode);
	};

	const handleRunTests = async () => {
		setIsRunning(true);
		try {
			await onRunTests();
		} finally {
			setIsRunning(false);
		}
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			await onSubmit();
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReset = () => {
		setCode(challenge.starterCode);
		onCodeChange(challenge.starterCode);
	};

	return (
		<div className="h-full flex flex-col">
			<div className="border-b p-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Badge variant="outline" className="font-mono">
						{challenge.language}
					</Badge>
					<span className="text-sm text-muted-foreground">{t("editor.codeEditor")}</span>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
						<RotateCcw className="h-4 w-4" />
						{t("editor.reset")}
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={handleRunTests}
						disabled={isRunning || isSubmitting}
						className="gap-2"
					>
						{isRunning ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Play className="h-4 w-4" />
						)}
						{isRunning ? t("editor.running") : t("editor.runTests")}
					</Button>

					<Button
						size="sm"
						onClick={handleSubmit}
						disabled={isRunning || isSubmitting}
						className="gap-2"
					>
						{isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Play className="h-4 w-4" />
						)}
						{isSubmitting ? t("editor.submitting") : t("editor.submit")}
					</Button>
				</div>
			</div>

			<div className="flex-1 relative">
				<Editor
					height="100%"
					language={getMonacoLanguage(challenge.language)}
					value={code}
					onChange={handleCodeChange}
					theme="vs-dark"
					options={{
						fontSize: 14,
						minimap: { enabled: false },
						scrollBeyondLastLine: false,
						automaticLayout: true,
						tabSize: 2,
						insertSpaces: true,
						wordWrap: "on",
						lineNumbers: "on",
						glyphMargin: true,
						folding: true,
						matchBrackets: "always",
						autoClosingBrackets: "always",
						autoClosingQuotes: "always",
						suggestOnTriggerCharacters: true,
						quickSuggestions: true,
						parameterHints: {
							enabled: true,
						},
						hover: {
							enabled: true,
						},
					}}
					onMount={(_editor, _monaco) => {
						// Additional language configurations can be added here
					}}
				/>
			</div>

			<div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
				<div className="flex items-center gap-4">
					<span>Lines: {code.split("\n").length}</span>
					<span>Characters: {code.length}</span>
				</div>

				<div className="flex items-center gap-2">
					{isRunning && (
						<Badge variant="secondary" className="gap-1">
							<Loader2 className="h-3 w-3 animate-spin" />
							Running Tests...
						</Badge>
					)}
					{isSubmitting && (
						<Badge variant="secondary" className="gap-1">
							<Loader2 className="h-3 w-3 animate-spin" />
							Submitting...
						</Badge>
					)}
				</div>
			</div>
		</div>
	);
}

function getMonacoLanguage(language: string): string {
	switch (language.toLowerCase()) {
		case "rust":
			return "rust";
		case "javascript":
		case "js":
			return "javascript";
		case "typescript":
		case "ts":
			return "typescript";
		case "python":
			return "python";
		case "java":
			return "java";
		case "cpp":
		case "c++":
			return "cpp";
		case "c":
			return "c";
		case "go":
			return "go";
		case "php":
			return "php";
		default:
			return "plaintext";
	}
}
