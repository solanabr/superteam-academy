/**
 * Where a compiler diagnostic sits in the learner's editor.
 *
 * The build does not compile the editor's text as it is: `buildGradeFiles` puts
 * lines above the learner's code and moves the verification harness into a file
 * of its own. This is the one place that turns a compiler position back into an
 * editor position. Pure and dependency-free: it runs in the browser.
 */

import type { BuildDiagnostic } from "@/lib/build-server/diagnostics";
import { learnerLinesInLib, LIB_PATH } from "./harness";

/** What a build was made from. */
export interface BuildSource {
  /** The editor's text when the build started. */
  code: string;
  /** The lesson's starter, which carries the harness. */
  starter: string;
}

/**
 * A range in the editor. Lines and columns are 1-based, columns count UTF-16
 * units as the editor does, and `endColumn` is exclusive. The end equals the
 * start when the diagnostic does not say where its span ends.
 */
export interface EditorRange {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}

/**
 * A compiler error or warning at a place in the editor. `message` and `code`
 * come from compiling the learner's code: show them as text only.
 */
export interface EditorMarker extends EditorRange {
  severity: "error" | "warning";
  message: string;
  /** The compiler's code for it, e.g. `E0425`. */
  code: string | null;
}

/**
 * The diagnostics of a build that have a place in the learner's editor, in the
 * order given. The others are left out with their messages (see
 * `toEditorRange`).
 */
export function toEditorMarkers(
  diagnostics: readonly BuildDiagnostic[],
  source: BuildSource
): EditorMarker[] {
  return diagnostics.flatMap((diagnostic) => {
    const range = toEditorRange(diagnostic, source);
    if (!range) return [];
    const { level, message, code } = diagnostic;
    return [{ ...range, severity: level, message, code }];
  });
}

/**
 * The editor column of the compiler's column `col` in `text`. The compiler
 * counts characters and the editor counts UTF-16 units, so the two differ after
 * a character outside the BMP. A column past the end of the line stops there.
 */
function editorColumn(text: string, col: number): number {
  let column = 1;
  let remaining = col - 1;
  for (const char of text) {
    if (remaining <= 0) break;
    column += char.length;
    remaining--;
  }
  return column;
}

/**
 * The editor range of `diagnostic`, or null when it has no place in the
 * learner's editor:
 *
 * - it is in a file other than the crate root (the hidden verification file,
 *   the cache-busting file). Do not show such a diagnostic's message either:
 *   it describes a file the learner cannot see;
 * - its line is one the build added above the learner's code;
 * - its line is past the last learner line that was compiled. In a lesson with
 *   a harness the editor still has text there, which is not what the compiler
 *   read.
 */
export function toEditorRange(
  diagnostic: BuildDiagnostic,
  source: BuildSource
): EditorRange | null {
  if (diagnostic.file !== LIB_PATH) return null;

  const { linesAbove, lines } = learnerLinesInLib(source.code, source.starter);
  const line = diagnostic.line - linesAbove;
  const text = lines[line - 1];
  if (line < 1 || text === undefined) return null;
  const column = editorColumn(text, diagnostic.col);

  const endLine = diagnostic.endLine - linesAbove;
  const endText = lines[endLine - 1];
  if (endLine < line || endText === undefined) {
    return { line, column, endLine: line, endColumn: column };
  }
  const endColumn = editorColumn(endText, diagnostic.endCol);
  if (endLine === line && endColumn < column) {
    return { line, column, endLine: line, endColumn: column };
  }
  return { line, column, endLine, endColumn };
}
