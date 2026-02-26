declare module "@superteam-academy/editor" {
	export interface MonacoEditorInstance {
		onChange: (callback: (value: string) => void) => void;
	}
	export function createMonacoEditor(container: HTMLElement): Promise<MonacoEditorInstance>;
}
