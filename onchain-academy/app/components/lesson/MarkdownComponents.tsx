// components/lesson/MarkdownComponents.tsx

'use client';

import { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const markdownComponents: Components = {
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    if (!inline && language) {
      return (
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            padding: '1rem',
          }}
          showLineNumbers
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }

    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
        {children}
      </code>
    );
  },
};
