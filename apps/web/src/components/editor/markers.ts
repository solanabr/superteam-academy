import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { EditorMarker } from "./types";

/** Names this code's markers in a model, apart from any Monaco sets itself. */
export const BUILD_MARKER_OWNER = "build";

/**
 * The Monaco marker for `marker`, or null when the model has no such line.
 *
 * The message and the code are text from compiling the learner's code. Monaco
 * shows a string `message` as plain text, in the hover and in the F8 error
 * view. It makes links only from a `code` object that has a target and from
 * `relatedInformation`, so the code goes into the message and neither of those
 * is set.
 */
export function toMarkerData(
  monaco: Monaco,
  model: editor.ITextModel,
  marker: EditorMarker
): editor.IMarkerData | null {
  if (marker.line < 1 || marker.line > model.getLineCount()) return null;

  const hasSpan =
    marker.endLine > marker.line ||
    (marker.endLine === marker.line && marker.endColumn > marker.column);

  let range = {
    startLineNumber: marker.line,
    startColumn: marker.column,
    endLineNumber: marker.endLine,
    endColumn: marker.endColumn,
  };
  if (!hasSpan) {
    // The compiler gave a position only: mark the word there, or the line.
    const word = model.getWordAtPosition({
      lineNumber: marker.line,
      column: marker.column,
    });
    range = {
      startLineNumber: marker.line,
      startColumn:
        word?.startColumn ??
        (model.getLineFirstNonWhitespaceColumn(marker.line) || 1),
      endLineNumber: marker.line,
      endColumn: word?.endColumn ?? model.getLineMaxColumn(marker.line),
    };
  }

  return {
    ...range,
    severity:
      marker.severity === "error"
        ? monaco.MarkerSeverity.Error
        : monaco.MarkerSeverity.Warning,
    message: markerText(marker),
  };
}

/** A marker's message with its compiler code, as one line of plain text. */
export function markerText(marker: EditorMarker): string {
  return marker.code ? `${marker.message} [${marker.code}]` : marker.message;
}
