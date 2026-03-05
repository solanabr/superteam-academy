'use client';

import { useState } from 'react';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  syntaxHighlight?: boolean;
}

export function TypingAnimation({ text, className = '', syntaxHighlight = false }: TypingAnimationProps) {
  const [code, setCode] = useState(text);
  const [isFocused, setIsFocused] = useState(false);

  const resetCode = () => {
    setCode(text);
    setIsFocused(false); // Reset focus to show blinking cursor
  };

  const highlightSyntax = (code: string) => {
    if (!syntaxHighlight) return code;

    // Single-pass regex to avoid nested replacement issues
    // Order matters: Strings -> Keywords -> Functions -> Types -> References -> Operators
    const tokenRegex = /("[^"]*")|\b(pub|fn|let|if|return|mut)\b|(&[a-zA-Z_]\w*)|\b([A-Z]\w*)\b|\b(process_instruction|next_account_info|msg!|Ok|Err)\b|(::|!=|\?)/g;

    return code.replace(tokenRegex, (match, string, keyword, ref, type, func, op) => {
      if (string) return `<span class="text-green-600 dark:text-[#f1fa8c]">${string}</span>`;
      if (keyword) return `<span class="text-purple-600 dark:text-[#ff79c6]">${keyword}</span>`;
      if (ref) return `<span class="text-blue-600 dark:text-[#50fa7b]">${ref}</span>`; // References - blue in light, green in dark
      if (type) return `<span class="text-teal-600 dark:text-[#8be9fd]">${type}</span>`;
      if (func) return `<span class="text-yellow-600 dark:text-[#f1fa8c]">${func}</span>`;
      if (op) return `<span class="text-pink-600 dark:text-[#ff79c6]">${op}</span>`;
      return match;
    });
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Reset Button (Visible on Hover/Focus) */}
      <button 
        onClick={resetCode}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-ink-primary/10 hover:bg-ink-primary/20 text-ink-primary opacity-0 group-hover:opacity-100 transition-opacity z-20"
        title="Reset Code"
      >
        <ArrowCounterClockwiseIcon size={14} />
      </button>

      {/* Interactive Textarea (Transparent Text, Visible Cursor) */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-ink-primary font-mono resize-none border-0 outline-none p-0 m-0 leading-relaxed overflow-hidden z-10 selection:bg-ink-primary/20 whitespace-pre"
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />

      {/* Syntax Highlighted Rendering Layer (Behind) */}
      <div 
        className="pointer-events-none font-mono leading-relaxed whitespace-pre m-0 p-0"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ 
          __html: highlightSyntax(code) + (!isFocused ? '<span class="inline-block w-[2px] h-[1em] bg-ink-primary ml-px animate-pulse align-middle"></span>' : '') + '<br/>' 
        }}
      />
    </div>
  );
}
