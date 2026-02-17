export {
	MonacoEditorAdapter,
	type MonacoEditorConfig,
	type MonacoEditorInstance,
	createMonacoEditor,
} from "./monaco";
export {
	CodeMirrorAdapter,
	type CodeMirrorConfig,
	type CodeMirrorInstance,
	createCodeMirrorEditor,
} from "./codemirror";
export * from "./lang-typescript";
export * from "./lang-rust";
export * from "./lang-python";

// Core interfaces and implementations
export * from "./interfaces/code-editor";
export { EditorFactory, type EditorType, createEditor } from "./editor-factory";

// Theme and language support
export * from "./themes";
export * from "./languages";

// Plugin system
export * from "./plugins";

// Keybindings and shortcuts
export * from "./shortcuts";

// State management
export * from "./state";

// Accessibility features
export * from "./accessibility";

// Security features
export * from "./security";

// Performance optimization
export * from "./performance";

// Testing framework
export * from "./testing";
