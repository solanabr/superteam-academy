'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
}

const languageLabels: Record<string, string> = {
  rust: 'Rust',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  js: 'JavaScript',
  json: 'JSON',
  bash: 'Bash',
  shell: 'Shell',
  toml: 'TOML',
  yaml: 'YAML',
  markdown: 'Markdown',
  md: 'Markdown',
  text: 'Text',
  solidity: 'Solidity',
};

export function CodeBlock({
  language,
  code,
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div className={cn('group bg-muted/50 relative my-6 rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {filename && <span className="text-foreground text-sm font-medium">{filename}</span>}
          {!filename && language && (
            <span className="text-muted-foreground text-xs">
              {languageLabels[language] || language}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto p-4">
        <pre className="font-mono text-sm">
          <code>
            {lines.map((line, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  highlightLines.includes(index + 1) && 'bg-primary/10 -mx-4 px-4'
                )}
              >
                {showLineNumbers && (
                  <span className="text-muted-foreground mr-4 inline-block w-8 text-right select-none">
                    {index + 1}
                  </span>
                )}
                <span className="flex-1">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
