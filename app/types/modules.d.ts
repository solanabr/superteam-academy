declare module "@superteam-academy/editor" {
	export interface MonacoEditorInstance {
		dispose: () => void;
		getValue: () => string;
		setValue: (value: string) => void;
		onChange: (callback: (value: string) => void) => { dispose: () => void };
	}

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
	}

	export function createMonacoEditor(
		container: HTMLElement,
		initialValue?: string,
		config?: MonacoEditorConfig
	): Promise<MonacoEditorInstance>;
}
