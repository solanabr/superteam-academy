'use client';

import type { MDXComponents } from 'mdx/types';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';
import { Callout } from './callout';
import { Quiz } from './quiz';
import { ChallengeBlock } from './challenge-block';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Custom MDX components for lesson content
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings
    h1: ({ className, ...props }) => (
      <h1
        className={cn('mt-8 scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl', className)}
        {...props}
      />
    ),
    h2: ({ className, ...props }) => (
      <h2
        className={cn(
          'mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
          className
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        className={cn('mt-8 scroll-m-20 text-2xl font-semibold tracking-tight', className)}
        {...props}
      />
    ),
    h4: ({ className, ...props }) => (
      <h4
        className={cn('mt-6 scroll-m-20 text-xl font-semibold tracking-tight', className)}
        {...props}
      />
    ),

    // Paragraphs and text
    p: ({ className, ...props }) => (
      <p className={cn('leading-7 [&:not(:first-child)]:mt-6', className)} {...props} />
    ),
    strong: ({ className, ...props }) => (
      <strong className={cn('font-semibold', className)} {...props} />
    ),
    em: ({ className, ...props }) => <em className={cn('italic', className)} {...props} />,

    // Links
    a: ({ className, href, children, ...props }) => {
      const isExternal = href?.startsWith('http');
      if (isExternal) {
        return (
          <a
            className={cn(
              'text-primary hover:text-primary/80 font-medium underline underline-offset-4',
              className
            )}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <Link
          className={cn(
            'text-primary hover:text-primary/80 font-medium underline underline-offset-4',
            className
          )}
          href={href || '#'}
          {...props}
        >
          {children}
        </Link>
      );
    },

    // Lists
    ul: ({ className, ...props }) => (
      <ul className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)} {...props} />
    ),
    ol: ({ className, ...props }) => (
      <ol className={cn('my-6 ml-6 list-decimal [&>li]:mt-2', className)} {...props} />
    ),
    li: ({ className, ...props }) => <li className={cn('leading-7', className)} {...props} />,

    // Blockquote
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn(
          'border-primary text-muted-foreground mt-6 border-l-4 pl-6 italic',
          className
        )}
        {...props}
      />
    ),

    // Code
    code: ({ className, children, ...props }) => {
      // Check if it's inline code (no language class)
      const isInline = !className?.includes('language-');
      if (isInline) {
        return (
          <code
            className={cn(
              'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm',
              className
            )}
            {...props}
          >
            {children}
          </code>
        );
      }
      // Block code is handled by pre
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ className, children, ...props }) => {
      // Extract language from className
      const childProps = (children as React.ReactElement)?.props as {
        className?: string;
        children?: React.ReactNode;
      };
      const language = childProps?.className?.replace('language-', '') || 'text';
      const code = childProps?.children || '';

      return (
        <CodeBlock
          language={language}
          code={typeof code === 'string' ? code : String(code)}
          className={className}
          {...props}
        />
      );
    },

    // Tables
    table: ({ className, ...props }) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className={cn('w-full border-collapse text-sm', className)} {...props} />
      </div>
    ),
    thead: ({ className, ...props }) => <thead className={cn('border-b', className)} {...props} />,
    tbody: ({ className, ...props }) => (
      <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
    ),
    tr: ({ className, ...props }) => (
      <tr className={cn('hover:bg-muted/50 border-b transition-colors', className)} {...props} />
    ),
    th: ({ className, ...props }) => (
      <th
        className={cn(
          'text-muted-foreground h-10 px-4 text-left align-middle font-medium',
          className
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }) => (
      <td className={cn('p-4 align-middle', className)} {...props} />
    ),

    // Horizontal rule
    hr: ({ className, ...props }) => <hr className={cn('my-8 border-t', className)} {...props} />,

    // Images
    img: ({ className, alt, src, width, height, ...props }) => {
      if (!src) {
        return null;
      }

      const parsedWidth = typeof width === 'string' ? Number(width) : width;
      const parsedHeight = typeof height === 'string' ? Number(height) : height;
      const resolvedWidth = typeof parsedWidth === 'number' && Number.isFinite(parsedWidth)
        ? parsedWidth
        : 1200;
      const resolvedHeight = typeof parsedHeight === 'number' && Number.isFinite(parsedHeight)
        ? parsedHeight
        : 675;

      return (
        <Image
          className={cn('my-6 rounded-lg border', className)}
          alt={alt || ''}
          src={src}
          width={resolvedWidth}
          height={resolvedHeight}
          style={{ width: '100%', height: 'auto' }}
          unoptimized
          {...props}
        />
      );
    },

    // Custom components
    Callout,
    Quiz,
    ChallengeBlock,
    CodeBlock,

    ...components,
  };
}

export { Callout, Quiz, ChallengeBlock, CodeBlock };
