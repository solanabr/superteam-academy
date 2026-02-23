"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { createMonacoEditor, type MonacoEditorInstance } from "@superteam/editor";

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
	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<MonacoEditorInstance | null>(null);
	const [code, setCode] = useState(initialCode);
	const [isRunning, setIsRunning] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Mount the editor from @superteam/editor
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let disposed = false;

		createMonacoEditor(container, initialCode, {
			language: challenge.language,
			theme: "superteam-dark",
			fontSize: 14,
			tabSize: 2,
			wordWrap: "on",
			minimap: false,
			lineNumbers: "on",
			folding: true,
			bracketMatching: true,
			autoClosingBrackets: true,
			autoClosingQuotes: true,
		}).then((instance) => {
			if (disposed) {
				instance.dispose();
				return;
			}
			editorRef.current = instance;

			instance.onChange((value) => {
				setCode(value);
				onCodeChange(value);
			});
		});

		return () => {
			disposed = true;
			editorRef.current?.dispose();
			editorRef.current = null;
		};
	}, [challenge.language, initialCode, onCodeChange]); // Only re-mount when language changes

	// Sync external code resets (e.g. from the Reset button)
	const syncCode = useCallback(
		(newCode: string) => {
			setCode(newCode);
			editorRef.current?.setValue(newCode);
			onCodeChange(newCode);
		},
		[onCodeChange]
	);

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
		syncCode(challenge.starterCode);
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

			<div className="flex-1 relative" ref={containerRef} />

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
