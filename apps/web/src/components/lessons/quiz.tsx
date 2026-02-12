'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ConfettiCelebration } from '@/components/ui/confetti';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import type { QuizData } from '@/lib/mock-data';

interface QuizProps {
  quiz: QuizData;
  onComplete: () => void;
}

export function Quiz({ quiz, onComplete }: QuizProps) {
  const t = useTranslations('lessonView');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const question = quiz.questions[currentQuestion]!;
  const totalQuestions = quiz.questions.length;
  const selectedAnswer = answers[question.id];

  const correctCount = quiz.questions.filter(
    (q) => answers[q.id] === q.correctAnswer
  ).length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercent >= quiz.passingScore;

  const handleAnswer = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [question.id]: parseInt(value) }));
      setShowExplanation(true);
    },
    [question.id]
  );

  const handleNext = useCallback(() => {
    setShowExplanation(false);
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((c) => c + 1);
    } else {
      setShowResults(true);
      if (passed) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, [currentQuestion, totalQuestions, passed]);

  const handleRetry = useCallback(() => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
    setShowExplanation(false);
    setIsCompleted(false);
  }, []);

  const handleMarkComplete = useCallback(() => {
    setIsCompleted(true);
    onComplete();
  }, [onComplete]);

  if (showResults) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <ConfettiCelebration show={showConfetti} />

        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">{t('quizResults')}</h2>
          <p className="text-muted-foreground">
            {correctCount}/{totalQuestions} {t('correct')} ({scorePercent}%)
          </p>
        </div>

        <div className="w-full max-w-md">
          <Progress value={scorePercent} className="h-3" />
        </div>

        <Badge
          className={
            passed
              ? 'bg-green-500/10 text-green-500 border-green-500/20 px-6 py-2 text-lg'
              : 'bg-red-500/10 text-red-500 border-red-500/20 px-6 py-2 text-lg'
          }
        >
          {passed ? `✅ ${t('passed')}` : `❌ ${t('failed')}`}
        </Badge>

        {passed && (
          <p className="text-sm text-muted-foreground">
            +{quiz.xpReward} XP {t('earned')}
          </p>
        )}

        {/* Review answers */}
        <div className="w-full max-w-lg space-y-3">
          {quiz.questions.map((q, i) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            return (
              <Card key={q.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {i + 1}. {q.question}
                      </p>
                      {!isCorrect && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {!passed && (
            <Button variant="outline" className="gap-2" onClick={handleRetry}>
              <RotateCcw className="h-4 w-4" />
              {t('retry')}
            </Button>
          )}
          {passed && !isCompleted && (
            <Button variant="solana" className="gap-2" onClick={handleMarkComplete}>
              <Trophy className="h-4 w-4" />
              {t('markComplete')} (+{quiz.xpReward} XP)
            </Button>
          )}
          {isCompleted && (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t('completed')}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t('question')} {currentQuestion + 1} / {totalQuestions}
        </span>
        <span>{Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%</span>
      </div>
      <Progress
        value={((currentQuestion + 1) / totalQuestions) * 100}
        className="h-2"
      />

      {/* Question */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">{question.question}</CardTitle>
          <Badge variant="secondary" className="w-fit text-xs">
            {question.type === 'true-false' ? t('trueFalse') : t('multipleChoice')}
          </Badge>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={handleAnswer}
          >
            {question.options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === question.correctAnswer;
              let optionClass = 'border-border';
              if (showExplanation && isSelected && isCorrect)
                optionClass = 'border-green-500 bg-green-500/5';
              if (showExplanation && isSelected && !isCorrect)
                optionClass = 'border-red-500 bg-red-500/5';
              if (showExplanation && !isSelected && isCorrect)
                optionClass = 'border-green-500/50 bg-green-500/5';

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${optionClass}`}
                >
                  <RadioGroupItem
                    value={i.toString()}
                    id={`q-${question.id}-${i}`}
                    disabled={showExplanation}
                  />
                  <Label
                    htmlFor={`q-${question.id}-${i}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {option}
                  </Label>
                  {showExplanation && isCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {showExplanation && isSelected && !isCorrect && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              );
            })}
          </RadioGroup>

          {/* Explanation */}
          {showExplanation && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
              💡 {question.explanation}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next button */}
      {showExplanation && (
        <Button variant="solana" className="gap-2 self-end" onClick={handleNext}>
          {currentQuestion < totalQuestions - 1 ? t('nextQuestion') : t('seeResults')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
