import type { useTranslations } from "next-intl";
import { MAX_BUILD_OUTPUT_CHARS } from "@/lib/ai/partner-types";
import { markerText } from "./markers";
import type { EditorMarker, ExecutionResult } from "./types";

/** The `lesson`-namespace translator. */
type Translator = ReturnType<typeof useTranslations>;

/** How many compiler errors the Output tab lists above the compiler log. */
export const MAX_LISTED_ERRORS = 3;

/**
 * A listed error as one line: "Line N: message [code]". The Output tab shows
 * this text and the AI Partner is sent the same.
 */
export function errorRowText(t: Translator, marker: EditorMarker): string {
  return t("compilerErrorAtLine", {
    line: String(marker.line),
    message: markerText(marker),
  });
}

/**
 * The compiler errors the Output tab lists for `result`: the first errors of a
 * failed build that have a place in the editor. Empty for any other run.
 */
export function listedErrors(result: ExecutionResult | null): EditorMarker[] {
  if (!result || result.success) return [];
  return (result.markers ?? [])
    .filter((marker) => marker.severity === "error")
    .slice(0, MAX_LISTED_ERRORS);
}

/**
 * What the AI Partner is told about a failed build: the sentence that stands
 * in for an error in the hidden verification file, then the listed error rows
 * as `rowText` writes them. Empty when the last run was not a failed build
 * with one of the two.
 *
 * It reads `harnessNotice` and `markers` only. Do not add `error` or a test
 * row's text: the compiler log can quote the hidden verification file.
 */
export function buildOutputText(
  result: ExecutionResult | null,
  rowText: (marker: EditorMarker) => string
): string {
  if (!result || result.success) return "";
  const rows = listedErrors(result).map(rowText);
  const lines = result.harnessNotice ? [result.harnessNotice, ...rows] : rows;
  return lines.join("\n").slice(0, MAX_BUILD_OUTPUT_CHARS);
}
