import type { CodeEditor, EditorOptions } from "./interfaces/code-editor";
import { MonacoCodeEditor } from "./implementations/monaco-editor";
import { CodeMirrorEditor } from "./implementations/codemirror-editor";

export type EditorType = "monaco" | "codemirror";

export class EditorFactory {
	private static instance: EditorFactory;

	private constructor() {}

	static getInstance(): EditorFactory {
		if (!EditorFactory.instance) {
			EditorFactory.instance = new EditorFactory();
		}
		return EditorFactory.instance;
	}

	createEditor(type: EditorType, options: EditorOptions = {}): CodeEditor {
		switch (type) {
			case "monaco":
				return new MonacoCodeEditor(options);
			case "codemirror":
				return new CodeMirrorEditor(options);
			default:
				throw new Error(`Unsupported editor type: ${type}`);
		}
	}

	createMonacoEditor(options: EditorOptions = {}): CodeEditor {
		return this.createEditor("monaco", options);
	}

	createCodeMirrorEditor(options: EditorOptions = {}): CodeEditor {
		return this.createEditor("codemirror", options);
	}

	// Utility method to detect the best editor for the environment
	getRecommendedEditor(): EditorType {
		// Monaco is better for complex TypeScript editing
		// CodeMirror is lighter and better for simple use cases
		return "monaco"; // Default to Monaco for LMS use case
	}
}

// Convenience functions
export function createEditor(type: EditorType, options: EditorOptions = {}): CodeEditor {
	return EditorFactory.getInstance().createEditor(type, options);
}

export function createMonacoEditor(options: EditorOptions = {}): CodeEditor {
	return EditorFactory.getInstance().createMonacoEditor(options);
}

export function createCodeMirrorEditor(options: EditorOptions = {}): CodeEditor {
	return EditorFactory.getInstance().createCodeMirrorEditor(options);
}
