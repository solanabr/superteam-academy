export interface Keybinding {
	key: string;
	command: string;
	when?: string; // Context condition
	description?: string;
}

export interface KeybindingContext {
	[key: string]: boolean;
}

export class KeybindingManager {
	private keybindings: Keybinding[] = [];
	private context: KeybindingContext = {};

	addKeybinding(keybinding: Keybinding): void {
		this.keybindings.push(keybinding);
	}

	removeKeybinding(key: string, command?: string): void {
		this.keybindings = this.keybindings.filter(
			(kb) => !(kb.key === key && (!command || kb.command === command))
		);
	}

	setContext(key: string, value: boolean): void {
		this.context[key] = value;
	}

	getContext(): KeybindingContext {
		return { ...this.context };
	}

	findKeybinding(key: string): Keybinding | undefined {
		return this.keybindings.find((kb) => kb.key === key && this.matchesContext(kb.when));
	}

	getAllKeybindings(): Keybinding[] {
		return [...this.keybindings];
	}

	private matchesContext(when?: string): boolean {
		if (!when) return true;

		// Simple context matching - can be extended for complex expressions
		return this.context[when] === true;
	}
}

// Predefined keybindings for LMS
export const DEFAULT_KEYBINDINGS: Keybinding[] = [
	{
		key: "Ctrl+S",
		command: "editor.save",
		description: "Save the current file",
	},
	{
		key: "Ctrl+Enter",
		command: "editor.execute",
		description: "Execute/run the code",
	},
	{
		key: "Ctrl+/",
		command: "editor.toggleComment",
		description: "Toggle line comment",
	},
	{
		key: "Ctrl+D",
		command: "editor.duplicateLine",
		description: "Duplicate the current line",
	},
	{
		key: "Alt+Up",
		command: "editor.moveLineUp",
		description: "Move line up",
	},
	{
		key: "Alt+Down",
		command: "editor.moveLineDown",
		description: "Move line down",
	},
	{
		key: "Ctrl+Shift+K",
		command: "editor.deleteLine",
		description: "Delete the current line",
	},
	{
		key: "Ctrl+F",
		command: "editor.find",
		description: "Find in editor",
	},
	{
		key: "Ctrl+H",
		command: "editor.replace",
		description: "Find and replace",
	},
	{
		key: "Ctrl+Z",
		command: "editor.undo",
		description: "Undo last action",
	},
	{
		key: "Ctrl+Y",
		command: "editor.redo",
		description: "Redo last action",
	},
	{
		key: "Ctrl+A",
		command: "editor.selectAll",
		description: "Select all text",
	},
	{
		key: "Ctrl+L",
		command: "editor.selectLine",
		description: "Select current line",
	},
	{
		key: "F11",
		command: "editor.toggleFullscreen",
		description: "Toggle fullscreen mode",
	},
];

export const VIM_KEYBINDINGS: Keybinding[] = [
	{
		key: "Escape",
		command: "vim.normalMode",
		description: "Enter normal mode",
	},
	{
		key: "i",
		command: "vim.insertMode",
		when: "vim.normalMode",
		description: "Enter insert mode",
	},
	{
		key: "v",
		command: "vim.visualMode",
		when: "vim.normalMode",
		description: "Enter visual mode",
	},
	{
		key: "h",
		command: "vim.moveLeft",
		when: "vim.normalMode",
		description: "Move cursor left",
	},
	{
		key: "j",
		command: "vim.moveDown",
		when: "vim.normalMode",
		description: "Move cursor down",
	},
	{
		key: "k",
		command: "vim.moveUp",
		when: "vim.normalMode",
		description: "Move cursor up",
	},
	{
		key: "l",
		command: "vim.moveRight",
		when: "vim.normalMode",
		description: "Move cursor right",
	},
];

export function createDefaultKeybindingManager(): KeybindingManager {
	const manager = new KeybindingManager();
	for (const kb of DEFAULT_KEYBINDINGS) {
		manager.addKeybinding(kb);
	}
	return manager;
}

export function createVimKeybindingManager(): KeybindingManager {
	const manager = new KeybindingManager();
	for (const kb of VIM_KEYBINDINGS) {
		manager.addKeybinding(kb);
	}
	return manager;
}
