import type { editor } from "monaco-editor";
import type { AiSuggestion } from "./types";

const SEVERITY_CLASSES: Record<string, string> = {
  error: "ai-suggestion-error",
  warning: "ai-suggestion-warning",
  info: "ai-suggestion-info",
};

const SEVERITY_GLYPH: Record<string, string> = {
  error: "ai-glyph-error",
  warning: "ai-glyph-warning",
  info: "ai-glyph-info",
};

/**
 * Apply AI suggestions as Monaco decorations.
 * Returns decoration IDs that can be passed to clearAiSuggestions.
 */
export function applyAiSuggestions(
  editorInstance: editor.IStandaloneCodeEditor,
  suggestions: AiSuggestion[]
): string[] {
  const decorations: editor.IModelDeltaDecoration[] = suggestions.map((s) => ({
    range: {
      startLineNumber: s.line,
      startColumn: 1,
      endLineNumber: s.line,
      endColumn: 1,
    },
    options: {
      isWholeLine: true,
      className: SEVERITY_CLASSES[s.severity] ?? SEVERITY_CLASSES.info,
      glyphMarginClassName: SEVERITY_GLYPH[s.severity] ?? SEVERITY_GLYPH.info,
    },
  }));

  const ids = editorInstance.deltaDecorations([], decorations);
  return ids;
}

/**
 * Remove a single AI suggestion decoration by ID.
 */
export function removeSingleSuggestion(
  editorInstance: editor.IStandaloneCodeEditor,
  decorationIds: string[],
  indexToRemove: number
): string[] {
  const idToRemove = decorationIds[indexToRemove];
  if (idToRemove) {
    editorInstance.deltaDecorations([idToRemove], []);
  }
  return decorationIds.filter((_, i) => i !== indexToRemove);
}

/**
 * Scroll the editor to a specific line and briefly highlight it.
 */
export function scrollToLine(
  editorInstance: editor.IStandaloneCodeEditor,
  line: number
): void {
  editorInstance.revealLineInCenter(line);
  editorInstance.setPosition({ lineNumber: line, column: 1 });
  editorInstance.focus();
}

/**
 * Clear all AI suggestion decorations.
 */
export function clearAiSuggestions(
  editorInstance: editor.IStandaloneCodeEditor,
  decorationIds: string[]
): void {
  if (decorationIds.length > 0) {
    editorInstance.deltaDecorations(decorationIds, []);
  }
}
