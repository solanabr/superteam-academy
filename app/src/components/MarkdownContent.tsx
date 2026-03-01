"use client";

import React from "react";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Process markdown content
  const processMarkdown = (text: string): string => {
    return text
      // Headers
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-white mt-6 first:mt-0">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 mt-6 text-white">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 mt-4 text-white">$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4 class="text-base font-medium mb-2 mt-4 text-white/90">$1</h4>')
      
      // Bold and Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="text-white"><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-white/90">$1</em>')
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-white/10 rounded text-sm text-green-400 font-mono">$1</code>')
      
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'text';
        return `<div class="my-4 rounded-lg overflow-hidden border border-white/10 bg-zinc-950">
          <div class="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
            <span class="text-xs text-white/40 font-mono">${language}</span>
          </div>
          <pre class="p-4 overflow-x-auto"><code class="text-sm text-white/90 font-mono">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </div>`;
      })
      
      // Lists
      .replace(/^- (.*$)/gm, '<li class="ml-4 text-white/80 mb-1 flex items-start gap-2"><span class="text-purple-400 mt-1.5">•</span><span>$1</span></li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 text-white/80 mb-1 flex items-start gap-2"><span class="text-green-400 mt-1 min-w-[1.5rem]">$&</span></li>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:text-purple-300 underline transition-colors">$1</a>')
      
      // Horizontal rule
      .replace(/^---+$/gm, '<hr class="my-6 border-white/10" />')
      
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-purple-500 pl-4 my-4 text-white/70 italic">$1</blockquote>')
      
      // Line breaks and paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4 text-white/80 leading-relaxed">')
      .replace(/\n/g, ' ');
  };

  const processedContent = processMarkdown(content);

  return (
    <div className="prose prose-invert max-w-none">
      <div 
        className="text-white/80 leading-relaxed"
        dangerouslySetInnerHTML={{ 
          __html: `<div class="space-y-2">${processedContent}</div>` 
        }}
      />
    </div>
  );
}
