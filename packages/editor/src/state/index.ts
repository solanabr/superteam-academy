export interface EditorState {
	id: string;
	value: string;
	language: string;
	theme: string;
	cursor: {
		line: number;
		column: number;
	};
	selections: Array<{
		startLine: number;
		startColumn: number;
		endLine: number;
		endColumn: number;
	}>;
	scrollTop: number;
	scrollLeft: number;
	viewState: unknown; // Editor-specific view state
	lastModified: Date;
	metadata?: Record<string, unknown>;
}

export interface EditorStateOptions {
	autoSave?: boolean;
	autoSaveDelay?: number;
	maxStates?: number;
	storageKey?: string;
}

export class EditorStateManager {
	private states: Map<string, EditorState> = new Map();
	private options: EditorStateOptions;
	private autoSaveTimer: number | null = null;

	constructor(options: EditorStateOptions = {}) {
		this.options = {
			autoSave: true,
			autoSaveDelay: 1000, // 1 second
			maxStates: 10,
			storageKey: "editor-states",
			...options,
		};

		this.loadFromStorage();
	}

	saveState(id: string, state: Partial<EditorState>): void {
		const existingState = this.states.get(id);
		const newState: EditorState = {
			id,
			value: "",
			language: "typescript",
			theme: "vs-dark",
			cursor: { line: 0, column: 0 },
			selections: [],
			scrollTop: 0,
			scrollLeft: 0,
			viewState: null,
			lastModified: new Date(),
			...existingState,
			...state,
		};

		this.states.set(id, newState);

		// Limit the number of stored states
		// biome-ignore lint/style/noNonNullAssertion: defaults set in constructor
		if (this.states.size > this.options.maxStates!) {
			this.cleanupOldStates();
		}

		this.saveToStorage();

		// Schedule auto-save if enabled
		if (this.options.autoSave) {
			this.scheduleAutoSave();
		}
	}

	loadState(id: string): EditorState | null {
		return this.states.get(id) || null;
	}

	deleteState(id: string): void {
		this.states.delete(id);
		this.saveToStorage();
	}

	getAllStates(): EditorState[] {
		return Array.from(this.states.values()).sort(
			(a, b) => b.lastModified.getTime() - a.lastModified.getTime()
		);
	}

	clearAllStates(): void {
		this.states.clear();
		this.saveToStorage();
	}

	exportState(id: string): string | null {
		const state = this.loadState(id);
		if (!state) return null;

		return JSON.stringify(state, null, 2);
	}

	importState(json: string): EditorState | null {
		try {
			const state = JSON.parse(json) as EditorState;
			this.saveState(state.id, state);
			return state;
		} catch (error) {
			console.error("Failed to import editor state:", error);
			return null;
		}
	}

	private loadFromStorage(): void {
		try {
			// biome-ignore lint/style/noNonNullAssertion: defaults set in constructor
			const stored = localStorage.getItem(this.options.storageKey!);
			if (stored) {
				const parsed = JSON.parse(stored);
				for (const [id, state] of Object.entries(parsed)) {
					this.states.set(id, {
						...(state as EditorState),
						lastModified: new Date((state as EditorState).lastModified),
					});
				}
			}
		} catch (error) {
			console.error("Failed to load editor states from storage:", error);
		}
	}

	private saveToStorage(): void {
		try {
			const data: Record<string, EditorState> = {};
			for (const [id, state] of this.states) {
				data[id] = state;
			}
			// biome-ignore lint/style/noNonNullAssertion: defaults set in constructor
			localStorage.setItem(this.options.storageKey!, JSON.stringify(data));
		} catch (error) {
			console.error("Failed to save editor states to storage:", error);
		}
	}

	private cleanupOldStates(): void {
		const sortedStates = Array.from(this.states.entries()).sort(
			([, a], [, b]) => a.lastModified.getTime() - b.lastModified.getTime()
		);

		// biome-ignore lint/style/noNonNullAssertion: defaults set in constructor
		const toRemove = sortedStates.slice(0, sortedStates.length - this.options.maxStates! + 1);
		for (const [id] of toRemove) {
			this.states.delete(id);
		}
	}

	private scheduleAutoSave(): void {
		if (this.autoSaveTimer) {
			clearTimeout(this.autoSaveTimer);
		}

		this.autoSaveTimer = window.setTimeout(() => {
			this.saveToStorage();
			this.autoSaveTimer = null;
		}, this.options.autoSaveDelay);
	}

	dispose(): void {
		if (this.autoSaveTimer) {
			clearTimeout(this.autoSaveTimer);
		}
		this.saveToStorage();
	}
}

// Utility functions
export function createDefaultStateManager(): EditorStateManager {
	return new EditorStateManager();
}

export function createSessionStateManager(): EditorStateManager {
	return new EditorStateManager({
		storageKey: "editor-session-states",
		maxStates: 50,
		autoSaveDelay: 500,
	});
}
