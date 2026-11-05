import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
}

/** One comment and nothing else. The tempered dot stops a match running past the first `-->`. */
const ONLY_A_COMMENT = /^<!--(?:(?!-->)[\s\S])*-->\s*$/;

/** Authors leave notes in comments; they shouldn't reach the page as text. */
function dropComments(node: MarkdownNode): void {
  if (!node.children) return;
  node.children = node.children.filter(
    (child) =>
      !(child.type === "html" && ONLY_A_COMMENT.test(child.value ?? ""))
  );
  node.children.forEach(dropComments);
}

function remarkDropComments() {
  return dropComments;
}

const remarkPlugins = [remarkGfm, remarkDropComments];
const rehypePlugins = [rehypeHighlight];

interface MarkdownProps {
  /** Markdown source. */
  children: string;
  /** Element overrides, e.g. a `pre` with a copy button. */
  components?: Components;
}

/**
 * The one Markdown renderer: GFM plus code highlighting. There is no raw HTML,
 * so a tag in the source renders as the text the author typed, and link and
 * image URLs go through react-markdown's safe-protocol filter. Add options here
 * rather than importing `react-markdown` elsewhere.
 */
export function Markdown({ children, components }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}
