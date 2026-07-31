import type { EditorLanguage } from "./types";

/**
 * Whether Monaco ships a document-formatting provider for this language.
 * Its TS worker formats TypeScript/JavaScript and its JSON worker formats
 * JSON; Rust is highlight-only, so the Format button hides there rather than
 * offering a control that does nothing (`CodeEditorHandle.format()` returning
 * false is the runtime backstop).
 *
 * Deliberately its own module, not part of `code-editor`: component tests mock
 * that file wholesale, and a capability predicate should not need a mock.
 */
export function canFormatLanguage(language: EditorLanguage): boolean {
  return language === "typescript" || language === "json";
}
