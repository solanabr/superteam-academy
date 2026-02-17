import type { editor } from "monaco-editor";

export const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineHeight: 22,
  scrollBeyondLastLine: false,
  padding: { top: 16, bottom: 16 },
  automaticLayout: true,
  tabSize: 2,
  wordWrap: "on",
  renderWhitespace: "selection",
  bracketPairColorization: { enabled: true },
  suggest: { showWords: false },
  quickSuggestions: false,
  formatOnPaste: true,
  formatOnType: true,
};

export const DARK_THEME: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#18181B",
    "editor.foreground": "#FAFAFA",
    "editorLineNumber.foreground": "#71717A",
    "editorLineNumber.activeForeground": "#ffd23f",
    "editor.selectionBackground": "#ffd23f30",
    "editor.lineHighlightBackground": "#27272A",
  },
};

export const BRASIL_THEME: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#243529",
    "editor.foreground": "#f7eacb",
    "editorLineNumber.foreground": "#008c4c",
    "editorLineNumber.activeForeground": "#ffd23f",
    "editor.selectionBackground": "#ffd23f30",
    "editor.lineHighlightBackground": "#1b231d",
  },
};
