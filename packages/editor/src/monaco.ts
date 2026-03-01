import * as monaco from "monaco-editor";
import { detectLanguage } from "./languages";

export interface MonacoEditorConfig {
	language: string;
	theme?: string;
	fontSize?: number;
	tabSize?: number;
	wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded";
	minimap?: boolean;
	lineNumbers?: "on" | "off" | "relative" | "interval";
	folding?: boolean;
	bracketMatching?: boolean;
	autoClosingBrackets?: boolean;
	autoClosingQuotes?: boolean;
	formatOnPaste?: boolean;
	formatOnType?: boolean;
}

export interface MonacoEditorInstance {
	editor: monaco.editor.IStandaloneCodeEditor;
	container: HTMLElement;
	dispose: () => void;
	getValue: () => string;
	setValue: (value: string) => void;
	focus: () => void;
	layout: (dimension?: { width: number; height: number }) => void;
	onChange: (callback: (value: string) => void) => monaco.IDisposable;
	onSave: (callback: () => void) => monaco.IDisposable;
}

class MonacoEditorAdapter {
	private static instance: MonacoEditorAdapter;
	private monaco: typeof monaco | null = null;

	static getInstance(): MonacoEditorAdapter {
		if (!MonacoEditorAdapter.instance) {
			MonacoEditorAdapter.instance = new MonacoEditorAdapter();
		}
		return MonacoEditorAdapter.instance;
	}

	async initialize(): Promise<void> {
		if (this.monaco) return;

		this.monaco = monaco;

		this.monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
			target: this.monaco.languages.typescript.ScriptTarget.ES2020,
			allowNonTsExtensions: true,
			moduleResolution: this.monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: this.monaco.languages.typescript.ModuleKind.CommonJS,
			noEmit: true,
			esModuleInterop: true,
			jsx: this.monaco.languages.typescript.JsxEmit.React,
			reactNamespace: "React",
			allowJs: true,
			typeRoots: ["node_modules/@types"],
		});

		this.monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			target: this.monaco.languages.typescript.ScriptTarget.ES2020,
			allowNonTsExtensions: true,
			moduleResolution: this.monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: this.monaco.languages.typescript.ModuleKind.CommonJS,
			noEmit: true,
			esModuleInterop: true,
			jsx: this.monaco.languages.typescript.JsxEmit.React,
			reactNamespace: "React",
			allowJs: true,
			typeRoots: ["node_modules/@types"],
		});

		this.defineThemes();
	}

	private defineThemes(): void {
		if (!this.monaco) return;

		this.monaco.editor.defineTheme("superteam-dark", {
			base: "vs-dark",
			inherit: true,
			rules: [
				{ token: "comment", foreground: "6A9955" },
				{ token: "keyword", foreground: "569CD6" },
				{ token: "string", foreground: "CE9178" },
				{ token: "number", foreground: "B5CEA8" },
				{ token: "type", foreground: "4EC9B0" },
				{ token: "class", foreground: "4EC9B0" },
				{ token: "function", foreground: "DCDCAA" },
				{ token: "variable", foreground: "9CDCFE" },
			],
			colors: {
				"editor.background": "#1e1e1e",
				"editor.foreground": "#d4d4d4",
				"editor.lineHighlightBackground": "#2d2d30",
				"editor.selectionBackground": "#264f78",
				"editor.inactiveSelectionBackground": "#3a3d41",
			},
		});
	}

	createEditor(
		container: HTMLElement,
		initialValue = "",
		config: MonacoEditorConfig = { language: "typescript" }
	): MonacoEditorInstance {
		if (!this.monaco) {
			throw new Error("Monaco Editor not initialized. Call initialize() first.");
		}

		const editorConfig: monaco.editor.IStandaloneEditorConstructionOptions = {
			value: initialValue,
			language: config.language,
			theme: config.theme || "superteam-dark",
			fontSize: config.fontSize || 14,
			tabSize: config.tabSize || 2,
			wordWrap: config.wordWrap || "on",
			minimap: { enabled: config.minimap ?? false },
			lineNumbers: config.lineNumbers || "on",
			folding: config.folding ?? true,
			matchBrackets:
				(config.bracketMatching ?? true) ? ("always" as const) : ("never" as const),
			autoClosingBrackets: config.autoClosingBrackets ? "always" : "never",
			autoClosingQuotes: config.autoClosingQuotes ? "always" : "never",
			formatOnPaste: config.formatOnPaste ?? true,
			formatOnType: config.formatOnType ?? true,
			scrollBeyondLastLine: false,
			automaticLayout: true,
			contextmenu: true,
			mouseWheelZoom: true,
			multiCursorModifier: "ctrlCmd",
			accessibilitySupport: "auto",
			suggestOnTriggerCharacters: true,
			acceptSuggestionOnEnter: "on",
			tabCompletion: "on",
			wordBasedSuggestions: "currentDocument",
			parameterHints: {
				enabled: true,
			},
			hover: {
				enabled: true,
			},
			quickSuggestions: {
				other: true,
				comments: true,
				strings: true,
			},
		};

		const editor = this.monaco.editor.create(container, editorConfig);

		const instance: MonacoEditorInstance = {
			editor,
			container,
			dispose: () => editor.dispose(),
			getValue: () => editor.getValue(),
			setValue: (value: string) => editor.setValue(value),
			focus: () => editor.focus(),
			layout: (dimension) => {
				if (dimension) {
					editor.layout(dimension);
				} else {
					editor.layout();
				}
			},
			onChange: (callback) => {
				return editor.onDidChangeModelContent(() => {
					callback(editor.getValue());
				});
			},
			onSave: (callback) => {
				editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, callback);
				return {
					dispose: () => {
						/* commands cannot be individually removed */
					},
				};
			},
		};

		return instance;
	}

	static getLanguageFromFilename(filename: string): string {
		const detected = detectLanguage(filename);
		if (detected) return detected.id;
		const ext = filename.split(".").pop()?.toLowerCase();
		switch (ext) {
			case "java":
				return "java";
			case "cpp":
			case "cc":
			case "cxx":
				return "cpp";
			case "c":
				return "c";
			case "go":
				return "go";
			case "php":
				return "php";
			case "rb":
				return "ruby";
			case "sh":
				return "shell";
			case "sql":
				return "sql";
			case "xml":
			case "html":
				return "html";
			case "css":
				return "css";
			case "scss":
			case "sass":
				return "scss";
			case "yaml":
			case "yml":
				return "yaml";
			default:
				return "plaintext";
		}
	}
}

export function createMonacoEditor(
	container: HTMLElement,
	initialValue?: string,
	config?: MonacoEditorConfig
): Promise<MonacoEditorInstance> {
	return MonacoEditorAdapter.getInstance()
		.initialize()
		.then(() =>
			MonacoEditorAdapter.getInstance().createEditor(container, initialValue, config)
		);
}
