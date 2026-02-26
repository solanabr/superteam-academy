/**
 * Customizable theme for the code editor (Monaco).
 * Use these colors to match your app theme; they map to Monaco tokenization and editor colors.
 */
export interface EditorThemeColors {
  /** Background of the editor */
  background: string;
  /** Default text color */
  foreground: string;
  /** Keywords: const, let, if, return, etc. */
  keyword: string;
  /** Types and type annotations (TypeScript, Rust) */
  type: string;
  /** Strings */
  string: string;
  /** Numbers */
  number: string;
  /** Comments */
  comment: string;
  /** Function and method names */
  function: string;
  /** Variables and parameters */
  variable: string;
  /** Operators */
  operator: string;
  /** Punctuation: brackets, semicolons */
  punctuation: string;
  /** Invalid/error underline */
  error: string;
  /** Line highlight (current line) */
  lineHighlight?: string;
  /** Selection background */
  selection?: string;
  /** Cursor color */
  cursor?: string;
}

export type EditorThemeId = string;

/**
 * Build a Monaco theme definition from our custom colors.
 * Pass the result to monaco.editor.defineTheme().
 */
export function buildMonacoTheme(
  id: EditorThemeId,
  colors: Partial<EditorThemeColors> & { background: string; foreground: string }
): import("monaco-editor").editor.IStandaloneThemeData {
  const c = colors as EditorThemeColors;
  return {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: c.keyword ?? "#569cd6" },
      { token: "type", foreground: c.type ?? "#4ec9b0" },
      { token: "string", foreground: c.string ?? "#ce9178" },
      { token: "number", foreground: c.number ?? "#b5cea8" },
      { token: "comment", foreground: c.comment ?? "#6a9955", fontStyle: "italic" },
      { token: "function", foreground: c.function ?? "#dcdcaa" },
      { token: "variable", foreground: c.variable ?? "#9cdcfe" },
      { token: "operator", foreground: c.operator ?? "#d4d4d4" },
      { token: "punctuation", foreground: c.punctuation ?? "#d4d4d4" },
    ],
    colors: {
      "editor.background": c.background,
      "editor.foreground": c.foreground,
      "editor.lineHighlightBackground": c.lineHighlight ?? c.background,
      "editor.selectionBackground": c.selection ?? "#264f78",
      "editorCursor.foreground": c.cursor ?? "#aeafad",
    },
  };
}

/** Default dark theme with TypeScript/JS-friendly colors (VS Code Dark+ style). */
export const defaultEditorThemeColors: EditorThemeColors = {
  background: "#1e1e1e",
  foreground: "#d4d4d4",
  keyword: "#569cd6",
  type: "#4ec9b0",
  string: "#ce9178",
  number: "#b5cea8",
  comment: "#6a9955",
  function: "#dcdcaa",
  variable: "#9cdcfe",
  operator: "#d4d4d4",
  punctuation: "#d4d4d4",
  error: "#f44747",
  lineHighlight: "#2d2d2d",
  selection: "#264f78",
  cursor: "#aeafad",
};

export const DEFAULT_EDITOR_THEME_ID = "superteam-dark";
