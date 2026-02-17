export interface CodeEditor {
	mount(container: HTMLElement): void;
	unmount(): void;
	setValue(value: string): void;
	getValue(): string;
	getLength(): number;
	setLanguage(language: string): void;
	getLanguage(): string;
	setTheme(theme: string): void;
	getTheme(): string;
	setReadOnly(readOnly: boolean): void;
	focus(): void;
	onChange(callback: (value: string) => void): void;
	onSave(callback: () => void): void;
	onExecute(callback: () => void): void;
	on(event: string, callback: (...args: unknown[]) => void): void;
	off(event: string, callback: (...args: unknown[]) => void): void;
	addCommand(keybinding: string, callback: () => void): void;
	setSize(width: number | string, height: number | string): void;
	dispose(): void;
}

export interface EditorOptions {
	value?: string;
	language?: string;
	theme?: string;
	fontSize?: number;
	tabSize?: number;
	insertSpaces?: boolean;
	wordWrap?: boolean;
	minimap?: boolean;
	lineNumbers?: boolean;
	folding?: boolean;
	readOnly?: boolean;
	autoSave?: boolean;
	autoExecute?: boolean;
}

export interface EditorPlugin {
	name: string;
	version: string;
	activate(editor: CodeEditor): void;
	deactivate(): void;
}

export interface EditorTheme {
	name: string;
	displayName: string;
	isDark: boolean;
	colors: Record<string, string>;
}

export interface EditorLanguage {
	id: string;
	displayName: string;
	extensions: string[];
	aliases?: string[];
}
