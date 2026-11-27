import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { isDraftPath, parseL10nPath } from "@superteam-lms/content-schema";
import { stripHtmlComments } from "@superteam-lms/types";
import { registerCheck } from "../lint";
import { walkFiles } from "../loader";
import { type RepoModel } from "../model";
import { diag, type Diagnostic, type Severity } from "../diagnostics";

/**
 * Lesson prose renders through `<Markdown>` (apps/web `components/ui/markdown`),
 * which has no raw HTML: a tag shows up as literal text. So a tag in prose is
 * always an authoring slip, usually a generic such as `Account<T>` written
 * without backticks.
 *
 * Parsed with the renderer's own remark stack, so "raw HTML" here means exactly
 * what the renderer sees: fenced, indented and inline code are code nodes and
 * never match, and neither do autolinks. Comments are exempt because lessons
 * render with `dropComments`, so an author's note never reaches the learner.
 * Whatever else shares an HTML block with a comment does show, unparsed.
 *
 * A warning while the catalog still has entries. Raise it to an error once they
 * are fixed.
 */
const SEVERITY: Severity = "warning";

interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
  position?: { start: { line: number } };
}

const parser = unified().use(remarkParse).use(remarkGfm);

function htmlNodes(node: MdNode, out: MdNode[] = []): MdNode[] {
  if (node.type === "html") out.push(node);
  for (const child of node.children ?? []) htmlNodes(child, out);
  return out;
}

/** The first tag in a node's non-empty remainder, else its first line of text. */
function label(rest: string): string {
  const tag = /<\/?[a-zA-Z][\w:-]*/.exec(rest);
  return tag ? `${tag[0]}>` : rest.split("\n")[0]!.slice(0, 40);
}

/** Repo-relative paths of every shipped prose file: source lessons, then overlays. */
function proseFiles(model: RepoModel): string[] {
  const files = new Set<string>();
  for (const entry of model.lessons) {
    for (const block of entry.lesson.blocks as Record<string, unknown>[]) {
      if (block.type === "prose" && typeof block.src === "string") {
        files.add(`${entry.dir}/${block.src}`);
      }
    }
  }
  for (const path of walkFiles(model.root)) {
    if (isDraftPath(path) || !path.endsWith(".md")) continue;
    if (parseL10nPath(path)?.rest.startsWith("lessons/")) files.add(path);
  }
  return [...files];
}

export function gate24Check(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const file of proseFiles(model)) {
    let text: string;
    try {
      text = readFileSync(join(model.root, file), "utf8");
    } catch {
      continue; // a missing file is gate 1's and gate 5's to report
    }
    for (const node of htmlNodes(parser.parse(text) as MdNode)) {
      const rest = stripHtmlComments(node.value ?? "").trim();
      if (!rest) continue;
      out.push(
        diag(
          "gate-24",
          SEVERITY,
          file,
          `line ${node.position?.start.line ?? "?"}: raw HTML \`${label(rest)}\` ` +
            "shows as literal text in a lesson; use Markdown, or backticks for code"
        )
      );
    }
  }
  return out;
}

registerCheck(gate24Check);
