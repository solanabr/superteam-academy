"use client";

import { Component, useMemo, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { stripHtmlComments } from "@superteam-lms/types";

interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
}

/**
 * Levels of nesting that still render as Markdown: every blockquote, list, item
 * and emphasis counts as one. Past this the text shows plain. The rest of the
 * pipeline and React's server renderer recurse, so a cap well under the stack
 * limit gives the same output everywhere, whatever stack each runtime has.
 */
export const MAX_MARKDOWN_DEPTH = 32;

/** Nesting markers on one line past this never reach the parser. */
const MAX_LINE_MARKERS = 128;

/** Inline delimiters in a run of lines with no blank between, likewise. */
const MAX_CHUNK_DELIMITERS = 1024;

/** One blockquote, list item or footnote opener at the current position. */
const CONTAINER_MARKER =
  /[ \t]*(?:>|[-+*][ \t]|\d{1,9}[.)][ \t]|\[\^[^\]\n]*\]:)/y;

const INLINE_DELIMITER = /[*_~[]/g;

/**
 * The parser's cost climbs steeply with markers packed onto a line and with
 * delimiters waiting to pair up: 10,000 characters of either can hold the main
 * thread for most of a minute before the cap below ever sees the tree. A linear
 * scan rules those out first. It can't tell a code block from prose, hence
 * limits far above anything real text reaches.
 */
function isTooCostlyToParse(source: string): boolean {
  for (const chunk of source.split(/\n[ \t]*\n/)) {
    const delimiters = chunk.match(INLINE_DELIMITER)?.length ?? 0;
    if (delimiters > MAX_CHUNK_DELIMITERS) return true;
  }
  for (const line of source.split("\n")) {
    let markers = 0;
    CONTAINER_MARKER.lastIndex = 0;
    while (CONTAINER_MARKER.test(line)) {
      if (++markers > MAX_LINE_MARKERS) return true;
    }
  }
  return false;
}

class MarkdownTooDeep extends Error {}

/** Iterative, so it can measure a tree the recursive plugins would overflow on. */
function remarkDepthCap() {
  return (tree: MarkdownNode) => {
    const stack: [MarkdownNode, number][] = [[tree, 0]];
    while (stack.length > 0) {
      const [node, depth] = stack.pop()!;
      if (!node.children) continue;
      if (depth > MAX_MARKDOWN_DEPTH) throw new MarkdownTooDeep();
      for (const child of node.children) stack.push([child, depth + 1]);
    }
  };
}

/** Parents whose children are blocks, so an `html` child is a whole HTML block. */
const BLOCK_PARENTS = new Set([
  "root",
  "blockquote",
  "listItem",
  "footnoteDefinition",
]);

/**
 * Authors leave notes in comments; they shouldn't reach the page as text. In
 * CommonMark an HTML block runs to the end of the line its comment closes on,
 * so anything else on that line stays. It stays as inert text, unparsed, the way
 * an HTML block's contents always are.
 */
function dropComments(node: MarkdownNode): void {
  if (!node.children) return;
  const isBlockParent = BLOCK_PARENTS.has(node.type);
  node.children = node.children.flatMap((child): MarkdownNode | [] => {
    if (child.type !== "html") return child;
    const value = child.value ?? "";
    const stripped = stripHtmlComments(value);
    if (stripped === value) return child;
    const rest = stripped.trim();
    if (!rest) return [];
    return isBlockParent
      ? { type: "paragraph", children: [{ type: "text", value: rest }] }
      : { ...child, value: rest };
  });
  node.children.forEach(dropComments);
}

function remarkDropComments() {
  return dropComments;
}

const remarkPlugins = [remarkGfm, remarkDepthCap];
const lessonRemarkPlugins = [remarkGfm, remarkDepthCap, remarkDropComments];
const rehypePlugins = [rehypeHighlight];

interface MarkdownProps {
  /** Markdown source. */
  children: string;
  /** Element overrides, e.g. a `pre` with a copy button. */
  components?: Components;
  /**
   * Hide HTML comments, for author-written lesson prose. Leave it off for
   * anything learners write, so readers always see what was posted.
   */
  dropComments?: boolean;
}

function PlainText({
  source,
  dropComments,
}: {
  source: string;
  dropComments: boolean;
}) {
  return (
    <p className="whitespace-pre-wrap break-words">
      {dropComments ? stripHtmlComments(source).trim() : source}
    </p>
  );
}

/** Error boundaries don't run on the server, so `Pipeline` handles what it can. */
class RenderBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Runs the pipeline inside this render, where a `try` can see it fail, on the
 * server as well as the client. The elements it returns are capped in depth, so
 * React can't overflow rendering them.
 */
function Pipeline({
  source,
  components,
  dropComments,
  fallback,
}: {
  source: string;
  components?: Components;
  dropComments: boolean;
  fallback: ReactNode;
}) {
  const rendered = useMemo(() => {
    if (isTooCostlyToParse(source)) return null;
    try {
      return ReactMarkdown({
        children: source,
        remarkPlugins: dropComments ? lessonRemarkPlugins : remarkPlugins,
        rehypePlugins,
        components,
      });
    } catch (error) {
      if (!(error instanceof MarkdownTooDeep)) {
        console.error("[markdown] rendering as plain text:", error);
      }
      return null;
    }
  }, [source, components, dropComments]);
  return rendered ?? fallback;
}

/**
 * The one Markdown renderer: GFM plus code highlighting. There is no raw HTML,
 * so a tag in the source renders as the text the author typed, and link and
 * image URLs go through react-markdown's safe-protocol filter. Text it can't
 * render, because it nests too deep or the pipeline throws, shows as plain text
 * and leaves the rest of the page alone. Add options here rather than importing
 * `react-markdown` elsewhere.
 */
export function Markdown({
  children,
  components,
  dropComments = false,
}: MarkdownProps) {
  const fallback = <PlainText source={children} dropComments={dropComments} />;
  return (
    <RenderBoundary key={children} fallback={fallback}>
      <Pipeline
        source={children}
        components={components}
        dropComments={dropComments}
        fallback={fallback}
      />
    </RenderBoundary>
  );
}
