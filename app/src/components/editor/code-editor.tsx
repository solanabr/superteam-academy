'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, RotateCcw, Check, Code } from 'lucide-react';

/**
 * Code Editor component
 *
 * For Monaco Editor integration:
 * 1. npm install @monaco-editor/react
 * 2. Replace the textarea below with the Monaco component
 */

interface Props {
  starterCode: string;
  solution: string;
  language: 'rust' | 'typescript';
  instructions: string;
  onSuccess?: () => void;
}

export function CodeEditor({
  starterCode,
  solution,
  language,
  instructions,
  onSuccess,
}: Props) {
  const t = useTranslations('lesson');
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const handleRun = useCallback(() => {
    const normalized = code.replace(/\s+/g, ' ').trim();
    const normalizedSolution = solution.replace(/\s+/g, ' ').trim();

    if (normalized === normalizedSolution) {
      setOutput('✅ All tests passed!');
      setIsCorrect(true);
      onSuccess?.();
    } else {
      setOutput('❌ Output does not match expected result. Keep trying!');
      setIsCorrect(false);
    }
  }, [code, solution, onSuccess]);

  const handleReset = useCallback(() => {
    setCode(starterCode);
    setOutput('');
    setIsCorrect(false);
  }, [starterCode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Code className="h-4 w-4" />
          {t('codeChallenge')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{instructions}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border overflow-hidden">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[400px] bg-[#1e1e1e] text-green-400 font-mono text-sm p-4 resize-none focus:outline-none"
            spellCheck={false}
            aria-label={`Code editor - ${language}`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleRun} variant="solana" className="gap-1.5">
            {isCorrect ? <Check className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {t('runCode')}
          </Button>
          <Button onClick={handleReset} variant="outline" className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            {t('resetCode')}
          </Button>
        </div>

        {output && (
          <div
            className={`p-3 rounded-md text-sm font-mono ${
              isCorrect
                ? 'bg-solana-green/10 text-solana-green border border-solana-green/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {output}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
