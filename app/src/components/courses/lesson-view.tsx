'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, Code, HelpCircle } from 'lucide-react';
import type { SanityLesson } from '@/types';

interface Props {
  lesson: SanityLesson;
  lessonIndex: number;
  isCompleted: boolean;
  xpPerLesson: number;
  onComplete?: () => void;
  onNext?: () => void;
  isLast: boolean;
}

export function LessonView({
  lesson,
  lessonIndex,
  isCompleted,
  xpPerLesson,
  onComplete,
  onNext,
  isLast,
}: Props) {
  const t = useTranslations('lesson');
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);

  const handleQuizCheck = () => {
    if (lesson.quiz && quizAnswer !== null) {
      const correct = quizAnswer === lesson.quiz.correctIndex;
      setQuizCorrect(correct);
      if (correct && onComplete) {
        onComplete();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {t('title', { number: lessonIndex + 1 })}: {lesson.title}
        </h2>
        {isCompleted && (
          <Badge variant="solana" className="gap-1">
            <Check className="h-3 w-3" />
            {t('completed')}
          </Badge>
        )}
      </div>

      {/* Lesson content */}
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: lesson.content }}
      />

      {/* Quiz */}
      {lesson.quiz && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4" />
              {t('quiz')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium">{lesson.quiz.question}</p>
            <div className="space-y-2">
              {lesson.quiz.options.map((option, idx) => (
                <button
                  key={idx}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    quizAnswer === idx
                      ? 'border-solana-purple bg-solana-purple/10'
                      : 'border-border hover:border-muted-foreground'
                  } ${
                    quizCorrect !== null && idx === lesson.quiz!.correctIndex
                      ? 'border-solana-green bg-solana-green/10'
                      : ''
                  }`}
                  onClick={() => setQuizAnswer(idx)}
                  disabled={quizCorrect === true}
                >
                  {option}
                </button>
              ))}
            </div>
            {quizCorrect !== null && (
              <p
                className={`text-sm font-medium ${
                  quizCorrect ? 'text-solana-green' : 'text-red-400'
                }`}
              >
                {quizCorrect
                  ? t('correct', { xp: xpPerLesson })
                  : t('incorrect')}
              </p>
            )}
            {quizCorrect !== true && (
              <Button onClick={handleQuizCheck} disabled={quizAnswer === null}>
                {t('checkAnswer')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Code challenge placeholder */}
      {lesson.codeChallenge && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Code className="h-4 w-4" />
              {t('codeChallenge')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {lesson.codeChallenge.instructions}
            </p>
            {/* Monaco Editor loaded dynamically */}
            <div className="h-[300px] rounded-md border bg-muted/50 flex items-center justify-center text-muted-foreground">
              Code Editor Loading...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        {!isCompleted && !lesson.quiz && (
          <Button variant="solana" onClick={onComplete}>
            {t('markComplete')}
          </Button>
        )}
        {!isLast && (
          <Button variant="outline" onClick={onNext} className="ml-auto gap-1">
            {t('nextLesson')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
