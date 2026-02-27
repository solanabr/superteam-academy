'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, HelpCircle, PartyPopper, Lightbulb } from 'lucide-react';

interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuizProps {
  question: string;
  options: QuizOption[];
  explanation?: string;
  className?: string;
}

export function Quiz({ question, options, explanation, className }: QuizProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (optionId: string) => {
    if (showResult) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    const selected = options.find((o) => o.id === selectedOption);
    setIsCorrect(!!selected?.isCorrect);
    setShowResult(true);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  return (
    <Card className={cn('my-6', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="text-primary h-5 w-5" />
          Knowledge Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-medium">{question}</p>

        <div className="space-y-2">
          {options.map((option) => {
            const isSelected = selectedOption === option.id;
            const showCorrect = showResult && option.isCorrect;
            const showIncorrect = showResult && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                disabled={showResult}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                  isSelected && !showResult && 'border-primary bg-primary/5',
                  showCorrect && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                  showIncorrect && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                  !showResult && !isSelected && 'hover:border-muted-foreground/50'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                    isSelected &&
                      !showResult &&
                      'border-primary bg-primary text-primary-foreground',
                    showCorrect && 'border-green-500 bg-green-500 text-white',
                    showIncorrect && 'border-red-500 bg-red-500 text-white',
                    !isSelected && !showResult && 'border-muted-foreground/50'
                  )}
                >
                  {showCorrect && <CheckCircle className="h-4 w-4" />}
                  {showIncorrect && <XCircle className="h-4 w-4" />}
                </div>
                <span className="flex-1">{option.text}</span>
              </button>
            );
          })}
        </div>

        {showResult && explanation && (
          <div
            className={cn(
              'rounded-lg p-4',
              isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-yellow-50 dark:bg-yellow-950/30'
            )}
          >
            <p className="mb-1 flex items-center gap-1 font-medium">
              {isCorrect ? (
                <>
                  <PartyPopper className="h-4 w-4" /> Correct!
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4" /> Not quite...
                </>
              )}
            </p>
            <p className="text-muted-foreground text-sm">{explanation}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!selectedOption}>
              Check Answer
            </Button>
          ) : (
            <Button variant="outline" onClick={handleReset}>
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
