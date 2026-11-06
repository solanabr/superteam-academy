/**
 * An HTML comment, spanning lines. The lazy match stops a comment at the first
 * `-->`, so anything after it stays in the text. `<!-- a` with no close is not
 * a comment.
 */
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

/**
 * Removes every HTML comment from a raw HTML fragment and returns what's left,
 * untrimmed. The result is still raw: callers treat it as text, never as markup.
 * Shared by lesson rendering and the content linter so both agree on what a
 * comment is.
 */
export function stripHtmlComments(value: string): string {
  return value.replace(HTML_COMMENT, "");
}
