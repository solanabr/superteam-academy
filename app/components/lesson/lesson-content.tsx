"use client";

import { PortableText, type PortableTextReactComponents, type PortableTextBlock } from "@portabletext/react";

const components: Partial<PortableTextReactComponents> = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-8 mb-3 text-xl font-bold text-content">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 mb-2 text-lg font-semibold text-content">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed text-content-secondary">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-2 border-solana-purple/40 pl-4 text-content-secondary italic">
        {children}
      </blockquote>
    ),
  },
  marks: {
    code: ({ children }) => (
      <code className="rounded bg-card px-1.5 py-0.5 font-mono text-sm text-solana-cyan">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const href = value?.href ?? "";
      const safe = /^https?:\/\//.test(href) ? href : "#";
      return (
        <a
          href={safe}
          target="_blank"
          rel="noopener noreferrer"
          className="text-solana-cyan underline hover:text-solana-purple"
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 list-disc pl-6 space-y-1 text-content-secondary">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 list-decimal pl-6 space-y-1 text-content-secondary">{children}</ol>
    ),
  },
};

export function LessonContent({ body }: { body: PortableTextBlock[] }) {
  if (!body?.length) {
    return (
      <div className="rounded-xl border border-edge-soft bg-card p-8 text-center">
        <p className="text-sm text-content-muted">
          Content not yet available in CMS. Complete the quiz below to proceed.
        </p>
      </div>
    );
  }

  return (
    <article className="prose-sm max-w-none">
      <PortableText value={body} components={components} />
    </article>
  );
}
