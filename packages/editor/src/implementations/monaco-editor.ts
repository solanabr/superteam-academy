import type { CodeEditor, EditorOptions } from "../interfaces/code-editor";

interface MonacoEditorInstance {
	dispose(): void;
	setValue(value: string): void;
	getValue(): string;
	getModel(): unknown;
	updateOptions(options: Record<string, unknown>): void;
	focus(): void;
	layout(): void;
	addCommand(keyCode: number, callback: () => void): void;
	onDidChangeModelContent(callback: () => void): void;
}

interface MonacoApi {
	editor: {
		create(container: HTMLElement, options: Record<string, unknown>): MonacoEditorInstance;
	};
}

export class MonacoCodeEditor implements CodeEditor {
	private editor: MonacoEditorInstance | null = null;
	private container: HTMLElement | null = null;
	private options: EditorOptions;
	private onChangeCallbacks: ((value: string) => void)[] = [];
	private onSaveCallbacks: (() => void)[] = [];
	private onExecuteCallbacks: (() => void)[] = [];
	private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

	constructor(options: EditorOptions = {}) {
		this.options = {
			value: "",
			language: "typescript",
			theme: "vs-dark",
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

		const monaco = await this.loadMonaco();

		this.editor = monaco.editor.create(container, {
			value: this.options.value,
			language: this.options.language,
			theme: this.options.theme,
			fontSize: this.options.fontSize,
			tabSize: this.options.tabSize,
			insertSpaces: this.options.insertSpaces,
			wordWrap: this.options.wordWrap ? "on" : "off",
			minimap: { enabled: this.options.minimap ?? false },
			lineNumbers: this.options.lineNumbers ? "on" : "off",
			folding: this.options.folding,
			readOnly: this.options.readOnly,
			automaticLayout: true,
			scrollBeyondLastLine: false,
			renderWhitespace: "selection",
			bracketPairColorization: { enabled: true },
			guides: {
				bracketPairs: true,
				indentation: true,
			},
			suggest: {
				showKeywords: true,
				showSnippets: true,
			},
			quickSuggestions: {
				other: true,
				comments: true,
				strings: true,
			},
		});

		this.setupEventListeners();

		if (this.options.language === "typescript") {
			this.configureTypeScript();
		}
	}

	unmount(): void {
		if (this.editor) {
			this.editor.dispose();
			this.editor = null;
		}
		this.container = null;
	}

	setValue(value: string): void {
		if (this.editor) {
			this.editor.setValue(value);
		}
	}

	getValue(): string {
		return this.editor ? this.editor.getValue() : "";
	}

	getLength(): number {
		return this.getValue().length;
	}

	setLanguage(language: string): void {
		if (this.editor) {
			const monaco = (window as unknown as Record<string, unknown>).monaco as Record<
				string,
				unknown
			>;
			const model = this.editor.getModel();
			(
				monaco.editor as Record<string, unknown> & {
					setModelLanguage(m: unknown, l: string): void;
				}
			).setModelLanguage(model, language);
		}
		this.options.language = language;
	}

	getLanguage(): string {
		return this.options.language || "typescript";
	}

	setTheme(theme: string): void {
		if (this.editor) {
			const monaco = (window as unknown as Record<string, unknown>).monaco as Record<
				string,
				unknown
			>;
			(monaco.editor as Record<string, unknown> & { setTheme(t: string): void }).setTheme(
				theme
			);
		}
		this.options.theme = theme;
	}

	getTheme(): string {
		return this.options.theme || "vs-dark";
	}

	setReadOnly(readOnly: boolean): void {
		if (this.editor) {
			this.editor.updateOptions({ readOnly });
		}
		this.options.readOnly = readOnly;
	}

	focus(): void {
		if (this.editor) {
			this.editor.focus();
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

	addCommand(keybinding: string, callback: () => void): void {
		if (this.editor) {
			const keyCode = this.parseKeybinding(keybinding);

			this.editor.addCommand(keyCode, callback);
		}
	}

	setSize(width: number | string, height: number | string): void {
		if (this.container) {
			this.container.style.width = typeof width === "number" ? `${width}px` : width;
			this.container.style.height = typeof height === "number" ? `${height}px` : height;
		}
		if (this.editor) {
			this.editor.layout();
		}
	}

	dispose(): void {
		this.unmount();
		this.onChangeCallbacks = [];
		this.onSaveCallbacks = [];
		this.onExecuteCallbacks = [];
		this.eventListeners.clear();
	}

	private async loadMonaco(): Promise<MonacoApi> {
		if (!(window as unknown as Record<string, unknown>).monaco) {
			await this.loadMonacoFromCDN();
		}
		return (window as unknown as Record<string, unknown>).monaco as MonacoApi;
	}

	private async loadMonacoFromCDN(): Promise<void> {
		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.src = "https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.min.js";
			script.onload = () => {
				const win = window as unknown as Record<string, unknown>;
				(
					win.require as Record<string, unknown> & {
						config(o: Record<string, unknown>): void;
					}
				).config({
					paths: {
						vs: "https://unpkg.com/monaco-editor@0.45.0/min/vs",
					},
				});

				(win.require as (deps: string[], cb: () => void) => void)(
					["vs/editor/editor.main"],
					() => {
						resolve();
					}
				);
			};
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}

	private setupEventListeners(): void {
		if (!this.editor) return;

		this.editor.onDidChangeModelContent(() => {
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
		});

		this.addCommand("Ctrl+S", () => {
			this.onSaveCallbacks.forEach((callback) => {
				callback();
			});
		});

		this.addCommand("Ctrl+Enter", () => {
			this.onExecuteCallbacks.forEach((callback) => {
				callback();
			});
		});

		this.addCommand("Cmd+Enter", () => {
			this.onExecuteCallbacks.forEach((callback) => {
				callback();
			});
		});
	}

	private configureTypeScript(): void {
		const monaco = (window as unknown as Record<string, unknown>).monaco as Record<
			string,
			unknown
		>;
		const languages = monaco.languages as Record<string, unknown>;
		const typescript = languages.typescript as Record<string, unknown>;
		const typescriptDefaults = typescript.typescriptDefaults as Record<string, unknown> & {
			setCompilerOptions(options: Record<string, unknown>): void;
			addExtraLib(content: string, filePath: string): void;
		};

		typescriptDefaults.setCompilerOptions({
			target: (typescript.ScriptTarget as Record<string, unknown>).ES2020,
			allowNonTsExtensions: true,
			moduleResolution: (typescript.ModuleResolutionKind as Record<string, unknown>).NodeJs,
			module: (typescript.ModuleKind as Record<string, unknown>).CommonJS,
			noEmit: true,
			esModuleInterop: true,
			jsx: (typescript.JsxEmit as Record<string, unknown>).React,
			reactNamespace: "React",
			allowJs: true,
			typeRoots: ["node_modules/@types"],
			strict: true,
			noImplicitAny: true,
			strictNullChecks: true,
			strictFunctionTypes: true,
			noImplicitReturns: true,
			noFallthroughCasesInSwitch: true,
			noUncheckedIndexedAccess: true,
			noImplicitOverride: true,
		});

		const libSource = `
      declare global {
        interface Window {
          solana?: unknown;
        }
      }
    `;
		typescriptDefaults.addExtraLib(libSource, "ts:global.d.ts");
	}

	private parseKeybinding(keybinding: string): number {
		const monaco = (window as unknown as Record<string, unknown>).monaco as Record<
			string,
			unknown
		>;
		const KeyMod = monaco.KeyMod as Record<string, number>;
		const KeyCode = monaco.KeyCode as Record<string, number>;

		const parts = keybinding.split("+");
		let keyCode = 0;

		for (const part of parts) {
			switch (part.toLowerCase()) {
				case "ctrl":
					keyCode |= KeyMod.CtrlCmd;
					break;
				case "cmd":
				case "meta":
					keyCode |= KeyMod.CtrlCmd;
					break;
				case "alt":
					keyCode |= KeyMod.Alt;
					break;
				case "shift":
					keyCode |= KeyMod.Shift;
					break;
				case "s":
					keyCode |= KeyCode.KeyS;
					break;
				case "enter":
					keyCode |= KeyCode.Enter;
					break;
				default:
					break;
			}
		}

		return keyCode;
	}
}
