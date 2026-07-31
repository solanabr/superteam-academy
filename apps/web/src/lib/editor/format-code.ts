import type { EditorLanguage } from "@/components/editor/types";

/**
 * Why Prettier and not Monaco's built-in formatter.
 *
 * `editor.action.formatDocument` on a TS model runs the TypeScript service's
 * `getFormattingEditsForDocument`, which is a WHITESPACE-ONLY formatter: it
 * fixes indentation and spacing but NEVER inserts line breaks. Measured against
 * the real reported input — a markdown-paste artifact pasted as one line — it
 * produced six edits that only added spaces inside `{ }` and left the code a
 * single line. Indistinguishable from "the button does nothing", which is
 * exactly how it was reported.
 *
 * Prettier re-prints from the AST, so a one-liner actually becomes readable
 * code. It also throws on unparseable input, which gives us an honest
 * "fix your syntax first" instead of a silent no-op.
 */
export type FormatStatus =
  | "formatted"
  | "unchanged"
  | "syntax-error"
  | "unsupported";

export type FormatResult =
  | { status: "formatted"; code: string }
  | { status: Exclude<FormatStatus, "formatted"> };

/** Prettier parser per editor language; `null` = no formatter available. */
function parserFor(language: EditorLanguage): "typescript" | "json" | null {
  switch (language) {
    case "typescript":
      return "typescript";
    case "json":
      return "json";
    // Rust has no Prettier plugin. The toolbar hides the button for it; this
    // is the backstop.
    case "rust":
      return null;
  }
}

/**
 * Formats `source` for `language`. Prettier and its plugins are imported
 * dynamically so none of it lands in the initial bundle — the cost is paid on
 * the first Format click and cached thereafter.
 */
export async function formatCode(
  source: string,
  language: EditorLanguage
): Promise<FormatResult> {
  const parser = parserFor(language);
  if (!parser) return { status: "unsupported" };

  try {
    const [{ format }, estree, plugin] = await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/estree"),
      parser === "typescript"
        ? import("prettier/plugins/typescript")
        : import("prettier/plugins/babel"),
    ]);

    const formatted = await format(source, {
      parser,
      // `estree` is the printer both parsers feed into.
      plugins: [estree.default ?? estree, plugin],
      // Match the editor's own tab settings so formatting never fights the
      // indentation the learner sees while typing.
      tabWidth: 2,
      useTabs: false,
    });

    return formatted === source
      ? { status: "unchanged" }
      : { status: "formatted", code: formatted };
  } catch {
    // Prettier throws a SyntaxError on unparseable input. Anything else that
    // goes wrong here is equally un-actionable for the learner, and the caller
    // reports it the same way rather than failing silently.
    return { status: "syntax-error" };
  }
}
