/**
 * Client-safe Lexical JSON → HTML converter.
 *
 * `@payloadcms/richtext-lexical/html` uses server-only imports, so we need a
 * lightweight alternative that can run in client components (for useLivePreview
 * updates). Also detects "markdown-in-Lexical" seed data (single paragraph with
 * raw markdown text) and returns the raw string so MarkdownContent can render it.
 */

// Lexical text format bitmask
const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface LexicalNode {
  type: string;
  text?: string;
  format?: number | string;
  children?: LexicalNode[];
  tag?: string;
  listType?: string;
  url?: string;
  fields?: Record<string, unknown>;
  [key: string]: unknown;
}

function convertTextNode(node: LexicalNode): string {
  let html = escapeHtml(node.text ?? "");
  const fmt = typeof node.format === "number" ? node.format : 0;
  if (fmt & IS_CODE) html = `<code>${html}</code>`;
  if (fmt & IS_BOLD) html = `<strong>${html}</strong>`;
  if (fmt & IS_ITALIC) html = `<em>${html}</em>`;
  if (fmt & IS_UNDERLINE) html = `<u>${html}</u>`;
  if (fmt & IS_STRIKETHROUGH) html = `<s>${html}</s>`;
  return html;
}

function convertNode(node: LexicalNode): string {
  switch (node.type) {
    case "text":
      return convertTextNode(node);

    case "linebreak":
      return "<br/>";

    case "paragraph":
      return `<p>${convertChildren(node)}</p>`;

    case "heading": {
      const tag = node.tag ?? "h2";
      return `<${tag}>${convertChildren(node)}</${tag}>`;
    }

    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      return `<${tag}>${convertChildren(node)}</${tag}>`;
    }

    case "listitem":
      return `<li>${convertChildren(node)}</li>`;

    case "quote":
      return `<blockquote>${convertChildren(node)}</blockquote>`;

    case "horizontalrule":
      return "<hr/>";

    case "link":
      return `<a href="${escapeHtml(node.url ?? "")}">${convertChildren(node)}</a>`;

    case "block": {
      // CodeBlock from Payload blocks feature
      const code = String(node.fields?.code ?? "");
      const lang = String(node.fields?.language ?? "");
      if (code) {
        return `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre>`;
      }
      return "";
    }

    default:
      // Unknown node with children — just render children
      if (node.children) return convertChildren(node);
      return "";
  }
}

function convertChildren(node: LexicalNode): string {
  return (node.children ?? []).map(convertNode).join("");
}

/**
 * Detect "markdown-in-Lexical": a root with a single paragraph containing a
 * single text node whose content looks like markdown.
 */
function extractRawText(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = (data as any).root;
  if (!Array.isArray(root?.children) || root.children.length !== 1)
    return undefined;
  const para = root.children[0];
  if (para.type !== "paragraph" || para.children?.length !== 1)
    return undefined;
  const textNode = para.children[0];
  if (textNode.type !== "text" || typeof textNode.text !== "string")
    return undefined;
  if (!/^#|\*\*|`/.test(textNode.text)) return undefined;
  return textNode.text;
}

/**
 * Convert Lexical JSON content to an HTML or markdown string.
 *
 * 1. If the data looks like raw-markdown-in-Lexical (seed data), returns the
 *    raw markdown string so MarkdownContent can render it with ReactMarkdown.
 * 2. Otherwise, walks the Lexical node tree and produces HTML.
 * 3. Returns undefined if data is falsy or unrecognizable.
 */
export function convertLexicalContent(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;

  // Check for markdown-in-Lexical seed data first
  const raw = extractRawText(data);
  if (raw) return raw;

  // Walk the Lexical tree
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = (data as any).root;
  if (!root?.children) return undefined;

  const html = (root.children as LexicalNode[]).map(convertNode).join("");
  return html || undefined;
}
