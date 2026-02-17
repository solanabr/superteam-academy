"use client";

import { useState, useEffect, useCallback } from "react";
import { Keyboard, X, Check, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

export interface KeyboardShortcut {
	id: string;
	category: string;
	action: string;
	defaultKeys: string[];
	currentKeys: string[];
	description: string;
	disabled?: boolean;
}

interface KeyboardShortcutsProps {
	shortcuts: KeyboardShortcut[];
	onShortcutChange?: (shortcutId: string, newKeys: string[]) => void;
	onResetToDefaults?: () => void;
	className?: string;
}

export function KeyboardShortcutsManager({
	shortcuts,
	onShortcutChange,
	onResetToDefaults,
	className,
}: KeyboardShortcutsProps) {
	const t = useTranslations("shortcuts");
	const { toast } = useToast();

	const [isOpen, setIsOpen] = useState(false);
	const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
	const [currentKeys, setCurrentKeys] = useState<string[]>([]);
	const [isRecording, setIsRecording] = useState(false);

	const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

	const groupedShortcuts = shortcuts.reduce(
		(acc, shortcut) => {
			if (!acc[shortcut.category]) {
				acc[shortcut.category] = [];
			}
			acc[shortcut.category].push(shortcut);
			return acc;
		},
		{} as Record<string, KeyboardShortcut[]>
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (!isRecording) return;

			event.preventDefault();
			event.stopPropagation();

			const keys: string[] = [];
			if (event.ctrlKey || event.metaKey) keys.push("Ctrl");
			if (event.shiftKey) keys.push("Shift");
			if (event.altKey) keys.push("Alt");
			if (event.key && !["Control", "Shift", "Alt", "Meta"].includes(event.key)) {
				keys.push(event.key.length === 1 ? event.key.toUpperCase() : event.key);
			}

			if (keys.length > 0) {
				setCurrentKeys(keys);
			}
		},
		[isRecording]
	);

	const handleKeyUp = useCallback(() => {
		if (isRecording && currentKeys.length > 0) {
			setIsRecording(false);
		}
	}, [isRecording, currentKeys]);

	useEffect(() => {
		if (isRecording) {
			document.addEventListener("keydown", handleKeyDown);
			document.addEventListener("keyup", handleKeyUp);
			return () => {
				document.removeEventListener("keydown", handleKeyDown);
				document.removeEventListener("keyup", handleKeyUp);
			};
		}
		return undefined;
	}, [isRecording, handleKeyDown, handleKeyUp]);

	const startRecording = () => {
		setCurrentKeys([]);
		setIsRecording(true);
	};

	const cancelRecording = () => {
		setIsRecording(false);
		setCurrentKeys([]);
	};

	const saveShortcut = () => {
		if (editingShortcut && currentKeys.length > 0) {
			const keyString = currentKeys.join("+");
			onShortcutChange?.(editingShortcut, [keyString]);
			setEditingShortcut(null);
			setCurrentKeys([]);
			setIsRecording(false);

			toast({
				title: t("shortcutUpdated"),
				description: t("shortcutUpdatedDesc"),
			});
		}
	};

	const resetShortcut = (shortcutId: string) => {
		const shortcut = shortcuts.find((s) => s.id === shortcutId);
		if (shortcut) {
			onShortcutChange?.(shortcutId, shortcut.defaultKeys);
			toast({
				title: t("shortcutReset"),
				description: t("shortcutResetDesc"),
			});
		}
	};

	const formatKeys = (keys: string[]) => {
		return keys
			.map((key) => {
				switch (key.toLowerCase()) {
					case "control":
					case "ctrl":
						return "Ctrl";
					case "meta":
					case "cmd":
						return "⌘";
					case "shift":
						return "⇧";
					case "alt":
					case "option":
						return "⌥";
					case "enter":
						return "↵";
					case "escape":
						return "⎋";
					case "backspace":
						return "⌫";
					case "delete":
						return "⌦";
					case "tab":
						return "⇥";
					case "arrowup":
						return "↑";
					case "arrowdown":
						return "↓";
					case "arrowleft":
						return "←";
					case "arrowright":
						return "→";
					case "space":
						return "␣";
					default:
						return key;
				}
			})
			.join(" + ");
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild={true}>
				<Button variant="outline" size="sm" className={className}>
					<Keyboard className="mr-2 h-4 w-4" />
					{t("keyboardShortcuts")}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Keyboard className="h-5 w-5" />
						{t("keyboardShortcuts")}
					</DialogTitle>
					<DialogDescription>{t("shortcutsDescription")}</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					<div className="flex justify-end">
						<Button variant="outline" size="sm" onClick={onResetToDefaults}>
							<RotateCcw className="mr-2 h-4 w-4" />
							{t("resetToDefaults")}
						</Button>
					</div>

					{categories.map((category) => (
						<div key={category} className="space-y-3">
							<h3 className="text-lg font-semibold capitalize">
								{t(`categories.${category}`)}
							</h3>

							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("action")}</TableHead>
										<TableHead>{t("shortcut")}</TableHead>
										<TableHead>{t("description")}</TableHead>
										<TableHead className="w-32">{t("actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{groupedShortcuts[category].map((shortcut) => (
										<TableRow key={shortcut.id}>
											<TableCell className="font-medium">
												{t(`actions.${shortcut.action}`)}
											</TableCell>
											<TableCell>
												{editingShortcut === shortcut.id ? (
													<div className="flex items-center gap-2">
														{isRecording ? (
															<div className="flex items-center gap-2">
																<Badge
																	variant="secondary"
																	className="animate-pulse"
																>
																	<Zap className="mr-1 h-3 w-3" />
																	{t("recording")}
																</Badge>
																<span className="text-sm text-muted-foreground">
																	{currentKeys.length > 0
																		? formatKeys(currentKeys)
																		: t("pressKeys")}
																</span>
															</div>
														) : (
															<div className="flex items-center gap-2">
																<Input
																	value={currentKeys.join("+")}
																	readOnly={true}
																	className="w-32 font-mono text-sm"
																	placeholder={t("clickToRecord")}
																/>
															</div>
														)}
													</div>
												) : (
													<div className="flex flex-wrap gap-1">
														{shortcut.currentKeys.map(
															(keyCombo, index) => (
																<Badge
																	key={index}
																	variant="outline"
																	className="font-mono text-xs"
																>
																	{formatKeys(
																		keyCombo.split("+")
																	)}
																</Badge>
															)
														)}
													</div>
												)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{t(`descriptions.${shortcut.action}`)}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													{editingShortcut === shortcut.id ? (
														<>
															<Button
																size="sm"
																variant="outline"
																onClick={saveShortcut}
																disabled={currentKeys.length === 0}
															>
																<Check className="h-3 w-3" />
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={cancelRecording}
															>
																<X className="h-3 w-3" />
															</Button>
														</>
													) : (
														<>
															<Button
																size="sm"
																variant="outline"
																onClick={() => {
																	setEditingShortcut(shortcut.id);
																	startRecording();
																}}
																disabled={shortcut.disabled}
															>
																{t("edit")}
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={() =>
																	resetShortcut(shortcut.id)
																}
																disabled={shortcut.disabled}
															>
																<RotateCcw className="h-3 w-3" />
															</Button>
														</>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					))}
				</div>

				<div className="mt-6 p-4 bg-muted rounded-lg">
					<h4 className="font-medium mb-2">{t("help")}</h4>
					<ul className="text-sm text-muted-foreground space-y-1">
						<li>• {t("helpRecording")}</li>
						<li>• {t("helpConflicts")}</li>
						<li>• {t("helpReset")}</li>
					</ul>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Keyboard Shortcuts Handler Hook
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
	const { toast } = useToast();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Don't trigger shortcuts when typing in inputs
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				event.target instanceof HTMLSelectElement ||
				(event.target as HTMLElement)?.contentEditable === "true"
			) {
				return;
			}

			const pressedKeys: string[] = [];
			if (event.ctrlKey || event.metaKey) pressedKeys.push("ctrl");
			if (event.shiftKey) pressedKeys.push("shift");
			if (event.altKey) pressedKeys.push("alt");
			if (event.key) pressedKeys.push(event.key.toLowerCase());

			const keyCombo = pressedKeys.join("+");

			const matchingShortcut = shortcuts.find((shortcut) =>
				shortcut.currentKeys.some(
					(keys) => keys.toLowerCase().split("+").sort().join("+") === keyCombo
				)
			);

			if (matchingShortcut && !matchingShortcut.disabled) {
				event.preventDefault();
				// Here you would call the actual action handler
				// For now, we'll just show a toast
				toast({
					title: "Shortcut triggered",
					description: `Action: ${matchingShortcut.action}`,
				});
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [shortcuts, toast]);
}

// Default shortcuts configuration
export const defaultKeyboardShortcuts: KeyboardShortcut[] = [
	{
		id: "navigation-home",
		category: "navigation",
		action: "goHome",
		defaultKeys: ["g", "h"],
		currentKeys: ["g", "h"],
		description: "Navigate to home page",
	},
	{
		id: "navigation-courses",
		category: "navigation",
		action: "goCourses",
		defaultKeys: ["g", "c"],
		currentKeys: ["g", "c"],
		description: "Navigate to courses page",
	},
	{
		id: "navigation-profile",
		category: "navigation",
		action: "goProfile",
		defaultKeys: ["g", "p"],
		currentKeys: ["g", "p"],
		description: "Navigate to profile page",
	},
	{
		id: "search-focus",
		category: "search",
		action: "focusSearch",
		defaultKeys: ["ctrl", "k"],
		currentKeys: ["ctrl", "k"],
		description: "Focus search input",
	},
	{
		id: "actions-create",
		category: "actions",
		action: "create",
		defaultKeys: ["ctrl", "n"],
		currentKeys: ["ctrl", "n"],
		description: "Create new item",
	},
	{
		id: "actions-edit",
		category: "actions",
		action: "edit",
		defaultKeys: ["ctrl", "e"],
		currentKeys: ["ctrl", "e"],
		description: "Edit current item",
	},
	{
		id: "actions-save",
		category: "actions",
		action: "save",
		defaultKeys: ["ctrl", "s"],
		currentKeys: ["ctrl", "s"],
		description: "Save changes",
	},
	{
		id: "actions-delete",
		category: "actions",
		action: "delete",
		defaultKeys: ["delete"],
		currentKeys: ["delete"],
		description: "Delete current item",
	},
	{
		id: "view-fullscreen",
		category: "view",
		action: "toggleFullscreen",
		defaultKeys: ["f11"],
		currentKeys: ["f11"],
		description: "Toggle fullscreen mode",
	},
	{
		id: "help-shortcuts",
		category: "help",
		action: "showShortcuts",
		defaultKeys: ["ctrl", "shift", "?"],
		currentKeys: ["ctrl", "shift", "?"],
		description: "Show keyboard shortcuts",
	},
];
