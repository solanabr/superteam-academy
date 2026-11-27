/**
 * The compiler diagnostics in the build server's `/build` answer
 * (apps/build-server `diagnostics.rs`). The limits below are the server's own.
 */

export const MAX_DIAGNOSTICS = 20;
export const MAX_DIAGNOSTIC_MESSAGE_CHARS = 300;
export const MAX_DIAGNOSTIC_CODE_CHARS = 16;
/** The build server refuses a longer file path. */
export const MAX_DIAGNOSTIC_PATH_CHARS = 128;

/**
 * One compiler error or warning. Lines and columns are the compiler's: 1-based,
 * columns counted in characters, `endCol` exclusive. The end equals the start
 * when the compiler output did not show where the span ends.
 *
 * `message` and `code` come from compiling untrusted code. Render them as text.
 */
export interface BuildDiagnostic {
  /** The path as submitted, e.g. `/src/lib.rs`. */
  file: string;
  line: number;
  col: number;
  endLine: number;
  endCol: number;
  level: "error" | "warning";
  /** The error code, e.g. `E0425`. */
  code: string | null;
  message: string;
}

/** Lines and columns are `u32` on the server. */
const MAX_POSITION = 2 ** 32 - 1;

function isPosition(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_POSITION
  );
}

/** A non-empty string of at most `maxChars` characters, counted as the server counts them. */
function isText(value: unknown, maxChars: number): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  // A character is at most two UTF-16 units, so a longer string is over the
  // cap whatever it holds. This bounds the cost of the count below.
  if (value.length > maxChars * 2) return false;
  return Array.from(value).length <= maxChars;
}

function toDiagnostic(entry: unknown): BuildDiagnostic | null {
  if (typeof entry !== "object" || entry === null) return null;
  const { file, line, col, end_line, end_col, level, code, message } =
    entry as Record<string, unknown>;

  if (!isText(file, MAX_DIAGNOSTIC_PATH_CHARS)) return null;
  if (!isPosition(line) || !isPosition(col)) return null;
  if (!isPosition(end_line) || !isPosition(end_col)) return null;
  if (end_line < line || (end_line === line && end_col < col)) return null;
  if (level !== "error" && level !== "warning") return null;
  if (code !== null && !isText(code, MAX_DIAGNOSTIC_CODE_CHARS)) return null;
  if (!isText(message, MAX_DIAGNOSTIC_MESSAGE_CHARS)) return null;

  // A new object, so nothing else in the entry travels with it.
  return {
    file,
    line,
    col,
    endLine: end_line,
    endCol: end_col,
    level,
    code,
    message,
  };
}

/**
 * The `diagnostics` field of a build answer, checked entry by entry. The list
 * is all or nothing: a value that is not a list, a list longer than the server
 * sends or a single entry of the wrong shape gives an empty list. So does a
 * missing field, which is what an older build server sends.
 */
export function readDiagnostics(value: unknown): BuildDiagnostic[] {
  if (!Array.isArray(value) || value.length > MAX_DIAGNOSTICS) return [];
  const diagnostics: BuildDiagnostic[] = [];
  for (const entry of value as unknown[]) {
    const diagnostic = toDiagnostic(entry);
    if (!diagnostic) return [];
    diagnostics.push(diagnostic);
  }
  return diagnostics;
}
