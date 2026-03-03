import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Lesson } from "@/types";

export interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const isHtml = content.trimStart().startsWith("<");

  if (isHtml) {
    return (
      <div
        className="prose prose-invert max-w-none [&_h1]:font-heading [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:font-heading [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:font-heading [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:my-3 [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ol]:my-3 [&_ol]:ml-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_li]:pl-1 [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-muted-foreground [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-[#333] [&_pre]:bg-[#1e1e1e] [&_pre]:p-4 [&_code]:font-mono [&_code]:text-sm [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_strong]:text-foreground"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="prose prose-invert max-w-none">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-heading mt-8 mb-4 text-3xl font-bold first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-heading mt-8 mb-3 text-2xl font-bold">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-heading mt-6 mb-2 text-xl font-semibold">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-3 text-sm leading-relaxed text-muted-foreground">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-3 ml-4 list-disc space-y-1.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-4 list-decimal space-y-1.5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 text-sm leading-relaxed text-muted-foreground">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-r-lg border-l-4 border-primary/40 bg-primary/5 px-4 py-3 text-sm italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-border" />,
          code: ({ className, children }) => {
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              const lang = className?.replace("language-", "");
              return (
                <div className="my-4 overflow-hidden rounded-lg border border-[#333] bg-[#1e1e1e]">
                  {lang && (
                    <div className="border-b border-[#333] bg-[#252526] px-4 py-1.5">
                      <span className="text-xs text-[#888]">{lang}</span>
                    </div>
                  )}
                  <pre className="overflow-x-auto p-4">
                    <code className="font-mono text-sm leading-relaxed text-[#d4d4d4]">
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-border text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-3 py-2 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-muted-foreground">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

export function generateContentPlaceholder(lesson: Lesson): string {
  return `# ${lesson.title}

${lesson.description}

## Overview

This lesson covers the fundamental concepts needed to understand ${lesson.title.toLowerCase()}. By the end of this lesson, you will have a solid understanding of the core principles and be ready to apply them in practice.

## Key Concepts

- **Accounts**: Everything on Solana is stored in accounts. Accounts hold data (state) and are owned by programs.
- **Programs**: Solana's smart contracts are called programs. They are stateless and process instructions.
- **Transactions**: Users interact with Solana by submitting transactions that contain one or more instructions.
- **Runtime**: The Solana runtime executes transactions in parallel using its Sealevel engine.

## How It Works

Solana uses a unique architecture that enables high throughput and low latency. The key innovations include:

- **Proof of History (PoH)**: A verifiable delay function that provides a cryptographic clock for the network
- **Tower BFT**: A PoH-optimized version of PBFT consensus
- **Gulf Stream**: Mempool-less transaction forwarding protocol
- **Turbine**: Block propagation protocol inspired by BitTorrent

\`\`\`typescript
import { Connection, clusterApiUrl } from "@solana/web3.js";

// Connect to devnet
const connection = new Connection(clusterApiUrl("devnet"));

// Get the current slot
const slot = await connection.getSlot();
console.log("Current slot:", slot);

// Get recent blockhash
const { blockhash } = await connection.getLatestBlockhash();
console.log("Recent blockhash:", blockhash);
\`\`\`

## Why This Matters

Understanding these fundamentals is critical for building efficient and secure applications on Solana. The account model is particularly important because it differs significantly from the storage patterns used on EVM-based chains.

> Solana's account model is one of the most important concepts to understand. Unlike Ethereum where contracts hold their own storage, Solana programs are stateless and all data lives in separate accounts.

## Summary

In this lesson, we covered:

- The basic architecture of Solana
- How accounts, programs, and transactions work together
- Key innovations that make Solana unique
- Why understanding these concepts is essential for development

---

In the next lesson, we will put these concepts into practice.`;
}
