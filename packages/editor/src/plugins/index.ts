import type { CodeEditor, EditorPlugin } from "../interfaces/code-editor";

export class EditorPluginManager {
	private plugins: Map<string, EditorPlugin> = new Map();
	private editor: CodeEditor | null = null;

	setEditor(editor: CodeEditor): void {
		this.editor = editor;
	}

	registerPlugin(plugin: EditorPlugin): void {
		if (this.plugins.has(plugin.name)) {
			throw new Error(`Plugin ${plugin.name} is already registered`);
		}

		this.plugins.set(plugin.name, plugin);

		if (this.editor) {
			plugin.activate(this.editor);
		}
	}

	unregisterPlugin(name: string): void {
		const plugin = this.plugins.get(name);
		if (plugin) {
			plugin.deactivate();
			this.plugins.delete(name);
		}
	}

	getPlugin(name: string): EditorPlugin | undefined {
		return this.plugins.get(name);
	}

	getAllPlugins(): EditorPlugin[] {
		return Array.from(this.plugins.values());
	}

	activateAll(): void {
		if (!this.editor) return;

		for (const plugin of this.plugins.values()) {
			plugin.activate(this.editor);
		}
	}

	deactivateAll(): void {
		for (const plugin of this.plugins.values()) {
			plugin.deactivate();
		}
	}

	dispose(): void {
		this.deactivateAll();
		this.plugins.clear();
		this.editor = null;
	}
}

export class AutoSavePlugin implements EditorPlugin {
	name = "auto-save";
	version = "1.0.0";
	private intervalId: number | null = null;
	private saveCallback: (() => void) | null = null;

	constructor(private interval = 30_000) {} // 30 seconds default

	activate(_editor: CodeEditor): void {
		this.saveCallback = () => {
			/* ignored */
		};

		this.intervalId = window.setInterval(() => {
			if (this.saveCallback) {
				this.saveCallback();
			}
		}, this.interval);
	}

	deactivate(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}
}

export class SyntaxHighlightPlugin implements EditorPlugin {
	name = "syntax-highlight";
	version = "1.0.0";

	activate(_editor: CodeEditor): void {
		/* noop */
	}

	deactivate(): void {
		/* noop */
	}
}

export class IntelliSensePlugin implements EditorPlugin {
	name = "intellisense";
	version = "1.0.0";

	activate(_editor: CodeEditor): void {
		/* noop */
	}

	deactivate(): void {
		/* noop */
	}
}

export class KeybindingPlugin implements EditorPlugin {
	name = "keybindings";
	version = "1.0.0";
	private keybindings: Map<string, () => void> = new Map();

	addKeybinding(key: string, callback: () => void): void {
		this.keybindings.set(key, callback);
	}

	activate(editor: CodeEditor): void {
		for (const [key, callback] of this.keybindings) {
			editor.addCommand(key, callback);
		}
	}

	deactivate(): void {
		this.keybindings.clear();
	}
}
