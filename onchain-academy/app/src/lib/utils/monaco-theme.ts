import type { Monaco } from "@monaco-editor/react";

export function setupMonacoTheme(monaco: Monaco) {
  monaco.editor.defineTheme("academy", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "C084FC" },
      { token: "string", foreground: "34D399" },
      { token: "number", foreground: "FB923C" },
      { token: "comment", foreground: "52525B", fontStyle: "italic" },
      { token: "type", foreground: "22D3EE" },
      { token: "function", foreground: "60A5FA" },
      { token: "variable", foreground: "D4D4D8" },
      { token: "operator", foreground: "A1A1AA" },
    ],
    colors: {
      "editor.background": "#0F0E0D",
      "editor.foreground": "#D4D4D8",
      "editor.lineHighlightBackground": "#1A1918",
      "editor.selectionBackground": "#2A2927",
      "editorLineNumber.foreground": "#3F3D3A",
      "editorLineNumber.activeForeground": "#71706D",
      "editorGutter.background": "#0F0E0D",
      "editorWidget.background": "#1A1918",
      "editorWidget.border": "#2A2927",
      "input.background": "#1A1918",
      "input.foreground": "#D4D4D8",
    },
  });
}
