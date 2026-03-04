import { PortableText, type PortableTextComponents } from "@portabletext/react";
import imageUrlBuilder from "@sanity/image-url";
import { publicClient } from "@/lib/sanity/client";
import { CodeCopyButton } from "@/components/shared/CodeCopyButton";
import type { PortableTextContent } from "@/lib/sanity/queries";

const builder = imageUrlBuilder(publicClient);
function urlFor(source: { asset: { _ref: string } }) {
  return builder.image(source);
}

function isSafeHref(href: string | undefined): boolean {
  if (!href) return false;
  try {
    const url = new URL(href, "https://example.com");
    return !["javascript:", "data:", "vbscript:"].includes(url.protocol);
  } catch {
    return false;
  }
}

const components: PortableTextComponents = {
  types: {
    image: ({ value }: { value: { asset: { _ref: string } } }) => {
      const url = urlFor(value).width(800).auto("format").url();
      return <img src={url} alt="" className="rounded-lg my-4 w-full" loading="lazy" />;
    },
    codeBlock: ({ value }: { value: { code: string; language: string } }) => (
      <div className="group relative my-4">
        <div className="flex items-center justify-between rounded-t-lg bg-muted px-4 py-2 text-xs text-muted-foreground">
          <span>{value.language}</span>
          <CodeCopyButton code={value.code} />
        </div>
        <pre className="overflow-x-auto rounded-b-lg bg-muted p-4 font-mono text-sm text-foreground">
          <code>{value.code}</code>
        </pre>
      </div>
    ),
    callout: ({ value }: { value: { type: string; text: string } }) => {
      const colors: Record<string, string> = {
        info: "border-blue-500 bg-blue-500/10",
        warning: "border-yellow-500 bg-yellow-500/10",
        error: "border-red-500 bg-red-500/10",
        tip: "border-green-500 bg-green-500/10",
      };
      return (
        <div className={`my-4 rounded-lg border-l-4 p-4 ${colors[value.type] ?? colors.info}`}>
          <p className="text-sm">{value.text}</p>
        </div>
      );
    },
  },
  marks: {
    code: ({ children }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>
    ),
    link: ({ children, value }) =>
      isSafeHref(value?.href) ? (
        <a href={value?.href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
          {children}
        </a>
      ) : (
        <>{children}</>
      ),
  },
  block: {
    h2: ({ children }) => <h2 className="mb-4 mt-8 text-2xl font-bold">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-3 mt-6 text-xl font-semibold">{children}</h3>,
    h4: ({ children }) => <h4 className="mb-2 mt-4 text-lg font-medium">{children}</h4>,
    normal: ({ children }) => <p className="mb-4 leading-7">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-4 border-primary/50 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-1">{children}</ul>,
    number: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-1">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-7">{children}</li>,
    number: ({ children }) => <li className="leading-7">{children}</li>,
  },
};

export function RichContent({ content }: { content: PortableTextContent }) {
  if (!content) return null;
  return <PortableText value={content} components={components} />;
}
