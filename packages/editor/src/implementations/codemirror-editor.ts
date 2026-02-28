import type { CodeEditor, EditorOptions } from "../interfaces/code-editor";

interface CodeMirrorViewInstance {
	destroy(): void;
	dispatch(spec: Record<string, unknown>): void;
	state: {
		doc: { length: number; toString(): string };
		facet(f: unknown): { reconfigure(ext: unknown): unknown };
	};
	focus(): void;
}

export class CodeMirrorEditor implements CodeEditor {
	private view: CodeMirrorViewInstance | null = null;
	private container: HTMLElement | null = null;
	private options: EditorOptions;
	private onChangeCallbacks: ((value: string) => void)[] = [];
	private onSaveCallbacks: (() => void)[] = [];
	private onExecuteCallbacks: (() => void)[] = [];
	private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();
	private editorViewEditable: ((val: boolean) => unknown) | null = null;

	constructor(options: EditorOptions = {}) {
		this.options = {
			value: "",
			language: "typescript",
			theme: "dark",
			fontSize: 14,
			tabSize: 2,
			insertSpaces: true,
			wordWrap: true,
			minimap: false,
			lineNumbers: true,
			folding: true,
			readOnly: false,
			autoSave: true,
			autoExecute: false,
			...options,
		};
	}

	async mount(container: HTMLElement): Promise<void> {
		this.container = container;

		const { EditorView, basicSetup } = await import("codemirror");
		const { EditorState } = await import("@codemirror/state");
		const {
			keymap,
			highlightSpecialChars,
			drawSelection,
			highlightActiveLine,
			dropCursor,
			rectangularSelection,
			crosshairCursor,
			lineNumbers,
			highlightActiveLineGutter,
		} = await import("@codemirror/view");
		const {
			indentOnInput,
			syntaxHighlighting,
			defaultHighlightStyle,
			bracketMatching,
			foldGutter,
			foldKeymap,
		} = await import("@codemirror/language");
		const { history, defaultKeymap, historyKeymap } = await import("@codemirror/commands");
		const { searchKeymap, highlightSelectionMatches } = await import("@codemirror/search");
		const { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } =
			await import("@codemirror/autocomplete");
		const { lintKeymap } = await import("@codemirror/lint");

		const language = await this.getLanguageSupport(this.options.language || "typescript");

		const extensions: unknown[] = [
			basicSetup,
			lineNumbers(),
			highlightActiveLineGutter(),
			highlightSpecialChars(),
			history(),
			foldGutter(),
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
			highlightActiveLine(),
			highlightSelectionMatches(),
			keymap.of([
				...closeBracketsKeymap,
				...defaultKeymap,
				...searchKeymap,
				...historyKeymap,
				...foldKeymap,
				...completionKeymap,
				...lintKeymap,
				{
					key: "Ctrl-s",
					run: () => {
						this.triggerSave();
						return true;
					},
				},
				{
					key: "Ctrl-Enter",
					run: () => {
						this.triggerExecute();
						return true;
					},
				},
				{
					key: "Cmd-Enter",
					run: () => {
						this.triggerExecute();
						return true;
					},
				},
			]),
			language,
			EditorView.updateListener.of((update: { docChanged: boolean }) => {
				if (update.docChanged) {
					const value = this.getValue();
					this.onChangeCallbacks.forEach((callback) => {
						callback(value);
					});
					const changeListeners = this.eventListeners.get("change");
					if (changeListeners) {
						changeListeners.forEach((cb) => {
							cb(value);
						});
					}
				}
			}),
		];

		if (this.options.theme === "dark") {
			const { oneDark } = await import("@codemirror/theme-one-dark");
			extensions.push(oneDark);
		}

		this.editorViewEditable = (val: boolean) => EditorView.editable.of(val);

		const state = EditorState.create({
			doc: this.options.value ?? "",
			extensions: extensions as import("@codemirror/state").Extension[],
		});

		this.view = new EditorView({
			state,
			parent: container,
		});
	}

	unmount(): void {
		if (this.view) {
			this.view.destroy();
			this.view = null;
		}
		this.container = null;
	}

	setValue(value: string): void {
		if (this.view) {
			this.view.dispatch({
				changes: { from: 0, to: this.view.state.doc.length, insert: value },
			});
		}
	}

	getValue(): string {
		return this.view ? this.view.state.doc.toString() : "";
	}

	getLength(): number {
		return this.view ? this.view.state.doc.length : 0;
	}

	setLanguage(language: string): void {
		this.options.language = language;
	}

	getLanguage(): string {
		return this.options.language || "typescript";
	}

	setTheme(theme: string): void {
		this.options.theme = theme;
	}

	getTheme(): string {
		return this.options.theme || "dark";
	}

	setReadOnly(readOnly: boolean): void {
		if (this.view && this.editorViewEditable) {
			this.view.dispatch({
				effects: this.editorViewEditable(!readOnly),
			});
		}
		this.options.readOnly = readOnly;
	}

	focus(): void {
		if (this.view) {
			this.view.focus();
		}
	}

	onChange(callback: (value: string) => void): void {
		this.onChangeCallbacks.push(callback);
	}

	onSave(callback: () => void): void {
		this.onSaveCallbacks.push(callback);
	}

	onExecute(callback: () => void): void {
		this.onExecuteCallbacks.push(callback);
	}

	on(event: string, callback: (...args: unknown[]) => void): void {
		const listeners = this.eventListeners.get(event) || [];
		listeners.push(callback);
		this.eventListeners.set(event, listeners);
	}

	off(event: string, callback: (...args: unknown[]) => void): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			this.eventListeners.set(
				event,
				listeners.filter((cb) => cb !== callback)
			);
		}
	}

	addCommand(_keybinding: string, _callback: () => void): void {
		/* noop */
	}

	setSize(width: number | string, height: number | string): void {
		if (this.container) {
			this.container.style.width = typeof width === "number" ? `${width}px` : width;
			this.container.style.height = typeof height === "number" ? `${height}px` : height;
		}
	}

	dispose(): void {
		this.unmount();
		this.onChangeCallbacks = [];
		this.onSaveCallbacks = [];
		this.onExecuteCallbacks = [];
		this.eventListeners.clear();
	}

	private async getLanguageSupport(language: string): Promise<unknown> {
		switch (language) {
			case "typescript":
			case "ts": {
				const { javascript } = await import("@codemirror/lang-javascript");
				return javascript({ typescript: true });
			}
			case "javascript":
			case "js": {
				const { javascript } = await import("@codemirror/lang-javascript");
				return javascript();
			}
			case "rust": {
				// @codemirror/lang-rust is not available; fall back to plain text
				return [];
			}
			case "json": {
				const { json } = await import("@codemirror/lang-json");
				return json();
			}
			default:
				return [];
		}
	}

	private triggerSave(): void {
		this.onSaveCallbacks.forEach((callback) => {
			callback();
		});
	}

	private triggerExecute(): void {
		this.onExecuteCallbacks.forEach((callback) => {
			callback();
		});
	}
}
