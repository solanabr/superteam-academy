
"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-6 text-white border-l-4 border-[#9945FF] pl-4 py-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold mt-10 mb-4 text-white border-l-4 border-[#14F195] pl-4 py-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold mt-8 mb-3 text-white">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <div className="text-gray-300 leading-relaxed mb-4 text-base">
              {children}
            </div>
          ),
          strong: ({ children }) => (
            <strong className="text-white font-black drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]">
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="space-y-3 my-6 list-none pl-0">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-3 group">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#14F195] group-hover:glow-green transition-all shrink-0" />
              <span className="text-gray-300 leading-relaxed">{children}</span>
            </li>
          ),
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const [copied, setCopied] = useState(false); // Note: This might violate rules if inside a loop/conditional, but here it's a component. Wait, this function is a component definition.
            // ReactMarkdown components are functional components.
            // However, defining it inline like this means it's recreated on every render.
            // But since it's just a definition in the prop, it might be okay, but useState inside it?
            // "components" prop takes a map of components.
            // If I define it inline, React might remount it every time MarkdownRenderer renders.
            // It's better to verify if this `useState` causes issues.
            // The previous code had it inline too. 
            // The error reported was about `className` on ReactMarkdown.
            // I will keep the structure but fix the className issue first.
            
            // To fix the hook rule issue (if any exist due to inline definition), ideally these should be defined outside.
            // But the user only reported `className`.
            
            // Let's stick to the requested fix: Wrap in div.
            
            const handleCopy = () => {
              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            };

            if (inline) {
              return (
                <code className="bg-[#1E1E24] text-[#14F195] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <div className="relative group my-8">
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-[#0A0A0F] border border-[#2E2E36] hover:border-[#9945FF]/50 text-gray-400 hover:text-white transition-all shadow-xl"
                  >
                    {copied ? <Check className="h-4 w-4 text-[#14F195]" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match ? match[1] : 'typescript'}
                  PreTag="div"
                  className="!bg-[#0A0A0F] !p-6 !rounded-2xl border border-[#2E2E36] !my-0 !text-sm scrollbar-thin scrollbar-thumb-[#2E2E36]"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
