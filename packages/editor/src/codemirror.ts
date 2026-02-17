import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import {
    keymap,
    highlightSpecialChars,
    drawSelection,
    dropCursor,
    rectangularSelection,
    crosshairCursor,
    highlightActiveLineGutter,
    highlightActiveLine,
    type ViewUpdate,
} from "@codemirror/view";
import {
    defaultHighlightStyle,
    syntaxHighlighting,
    indentOnInput,
    bracketMatching,
    foldGutter,
    foldKeymap,
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
    autocompletion,
    completionKeymap,
    closeBrackets,
    closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { javascript } from "@codemirror/lang-javascript";
import { typescript } from "./lang-typescript";
import { rust } from "./lang-rust";
import { python } from "./lang-python";

export interface CodeMirrorConfig {
	language: string;
	theme?: "light" | "dark";
	fontSize?: number;
	tabSize?: number;
	lineNumbers?: boolean;
	foldGutter?: boolean;
	bracketMatching?: boolean;
	autoCloseBrackets?: boolean;
	highlightActiveLine?: boolean;
	lineWrapping?: boolean;
	readOnly?: boolean;
	placeholder?: string;
}

export interface CodeMirrorInstance {
	view: EditorView;
	container: HTMLElement;
	dispose: () => void;
	getValue: () => string;
	setValue: (value: string) => void;
	focus: () => void;
	refresh: () => void;
	onChange: (callback: (value: string) => void) => void;
	onSave: (callback: () => void) => void;
}

export class CodeMirrorAdapter {
	private static instance: CodeMirrorAdapter;

	// Compartments for dynamic configuration
	private languageCompartment = new Compartment();
	private tabSizeCompartment = new Compartment();
	private themeCompartment = new Compartment();
	private readonlyCompartment = new Compartment();
	private keymapCompartment = new Compartment();

	static getInstance(): CodeMirrorAdapter {
		if (!CodeMirrorAdapter.instance) {
			CodeMirrorAdapter.instance = new CodeMirrorAdapter();
		}
		return CodeMirrorAdapter.instance;
	}

	createEditor(
		container: HTMLElement,
		initialValue = "",
		config: CodeMirrorConfig = { language: "javascript" }
	): CodeMirrorInstance {
		const languageExtension = this.getLanguageExtension(config.language);

		// Define onChange callback before state so the update listener can reference it
		let onChangeCallback: ((value: string) => void) | null = null;

		const startState = EditorState.create({
			doc: initialValue,
			extensions: [
				basicSetup,
				highlightSpecialChars(),
				history(),
				drawSelection(),
				dropCursor(),
				EditorState.allowMultipleSelections.of(true),
				indentOnInput(),
				syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
				bracketMatching(),
				closeBrackets(),
				autocompletion(),
				rectangularSelection(),
				crosshairCursor(),
				highlightSelectionMatches(),
				keymap.of([
					...closeBracketsKeymap,
					...defaultKeymap,
					...searchKeymap,
					...historyKeymap,
					...foldKeymap,
					...completionKeymap,
					...lintKeymap,
					indentWithTab,
				]),
				// Dynamic compartments
				this.languageCompartment.of(languageExtension),
				this.tabSizeCompartment.of(EditorState.tabSize.of(config.tabSize || 2)),
				this.themeCompartment.of(this.getThemeExtension(config.theme || "dark")),
				this.readonlyCompartment.of(EditorView.editable.of(!config.readOnly)),
				// Static extensions based on config
				...(config.lineNumbers !== false ? [highlightActiveLineGutter()] : []),
				...(config.foldGutter !== false ? [foldGutter()] : []),
				...(config.highlightActiveLine !== false ? [highlightActiveLine()] : []),
				...(config.lineWrapping ? [EditorView.lineWrapping] : []),
				// Dynamic keybinding compartment for onSave
				this.keymapCompartment.of([]),
				// Update listener for onChange
				EditorView.updateListener.of((update: ViewUpdate) => {
					if (update.docChanged && onChangeCallback) {
						onChangeCallback(update.view.state.doc.toString());
					}
				}),
			],
		});

		const view = new EditorView({
			state: startState,
			parent: container,
		});

		const instance: CodeMirrorInstance = {
			view,
			container,
			dispose: () => view.destroy(),
			getValue: () => view.state.doc.toString(),
			setValue: (value: string) => {
				view.dispatch({
					changes: { from: 0, to: view.state.doc.length, insert: value },
				});
			},
			focus: () => view.focus(),
			refresh: () => view.requestMeasure(),
			onChange: (callback) => {
				onChangeCallback = callback;
			},
			onSave: (callback) => {
				// Add save keybinding (Ctrl+S / Cmd+S)
				const saveKeymap = keymap.of([
					{
						key: "Mod-s",
						run: () => {
							callback();
							return true;
						},
					},
				]);

				view.dispatch({
					effects: this.keymapCompartment.reconfigure(saveKeymap),
				});
			},
		};

		return instance;
	}

	private getLanguageExtension(language: string) {
		switch (language.toLowerCase()) {
			case "javascript":
			case "js":
				return javascript({ jsx: true, typescript: false });
			case "typescript":
			case "ts":
				return typescript();
			case "tsx":
				return javascript({ jsx: true, typescript: true });
			case "rust":
			case "rs":
				return rust();
			case "python":
			case "py":
				return python();
			default:
				return javascript(); // fallback
		}
	}

	private getThemeExtension(_theme: "light" | "dark") {
		// For now, return empty extension. In a real implementation,
		// you'd define proper themes using @codemirror/theme-*
		return [];
	}

	// Utility methods
	static getLanguageFromFilename(filename: string): string {
		const ext = filename.split(".").pop()?.toLowerCase();
		switch (ext) {
			case "ts":
				return "typescript";
			case "tsx":
				return "tsx";
			case "js":
				return "javascript";
			case "jsx":
				return "javascript";
			case "rs":
				return "rust";
			case "py":
				return "python";
			default:
				return "javascript";
		}
	}

	// Configuration methods for dynamic updates
	updateLanguage(instance: CodeMirrorInstance, language: string): void {
		const extension = this.getLanguageExtension(language);
		instance.view.dispatch({
			effects: this.languageCompartment.reconfigure(extension),
		});
	}

	updateTabSize(instance: CodeMirrorInstance, tabSize: number): void {
		instance.view.dispatch({
			effects: this.tabSizeCompartment.reconfigure(EditorState.tabSize.of(tabSize)),
		});
	}

	setReadOnly(instance: CodeMirrorInstance, readOnly: boolean): void {
		instance.view.dispatch({
			effects: this.readonlyCompartment.reconfigure(EditorView.editable.of(!readOnly)),
		});
	}
}

export function createCodeMirrorEditor(
	container: HTMLElement,
	initialValue?: string,
	config?: CodeMirrorConfig
): CodeMirrorInstance {
	return CodeMirrorAdapter.getInstance().createEditor(container, initialValue, config);
}
