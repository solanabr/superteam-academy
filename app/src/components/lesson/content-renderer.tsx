"use client";

import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { cn } from "@/lib/utils";

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold mt-5 mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold mt-4 mb-2">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="text-muted-foreground leading-7 mb-4">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1 text-muted-foreground">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    code: ({ children }) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">
        {children}
      </code>
    ),
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {children}
      </a>
    ),
  },
  types: {
    codeBlock: ({ value }) => (
      <div className="my-6 rounded-lg overflow-hidden border border-border">
        {value.filename && (
          <div className="bg-muted px-4 py-2 text-xs text-muted-foreground font-mono border-b border-border">
            {value.filename}
          </div>
        )}
        <pre className="bg-card p-4 overflow-x-auto">
          <code className="text-sm font-mono">{value.code}</code>
        </pre>
      </div>
    ),
    callout: ({ value }) => {
      const styles: Record<string, string> = {
        info: "border-superteam-blue bg-superteam-blue/5",
        warning: "border-superteam-orange bg-superteam-orange/5",
        tip: "border-superteam-green bg-superteam-green/5",
        danger: "border-red-500 bg-red-500/5",
      };
      return (
        <div
          className={cn(
            "border-l-4 rounded-r-lg p-4 my-4",
            styles[value.tone] || styles.info
          )}
        >
          <p className="text-sm">{value.text}</p>
        </div>
      );
    },
    image: ({ value }) => (
      <figure className="my-6">
        <img
          src={value.asset?.url}
          alt={value.alt || ""}
          className="rounded-lg w-full"
        />
        {value.caption && (
          <figcaption className="text-center text-xs text-muted-foreground mt-2">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
  },
};

interface ContentRendererProps {
  content: unknown[];
}

export function ContentRenderer({ content }: ContentRendererProps) {
  if (!content || content.length === 0) {
    return <p className="text-muted-foreground">No content available.</p>;
  }
  return (
    <div className="prose-custom max-w-none">
      <PortableText value={content as any} components={components} />
    </div>
  );
}
