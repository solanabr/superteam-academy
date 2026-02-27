'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SkillAssessmentQuizProps {
  questions: Array<{
    id: string;
    question: string;
    options: Array<{
      text: string;
    }>;
  }>;
  onComplete: (answers: Array<{ questionId: string; optionIndex: number }>) => Promise<void>;
  isLoading?: boolean;
}

export function SkillAssessmentQuiz({
  questions,
  onComplete,
  isLoading = false,
}: SkillAssessmentQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionId: string; optionIndex: number }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleSelectOption = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = {
      questionId: currentQuestion.id,
      optionIndex,
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(answers);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentQuestionAnswered = answers.some((a) => a.questionId === currentQuestion.id);
  const isLastQuestion = currentStep === questions.length - 1;
  const allAnswered = answers.length === questions.length;

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Skill Assessment Quiz</CardTitle>
        <CardDescription>
          Question {currentStep + 1} of {questions.length}
        </CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">{currentQuestion.question}</h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected =
                answers.find((a) => a.questionId === currentQuestion.id)?.optionIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                    }`}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer font-normal">
                    {option.text}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button onClick={handleSubmit} disabled={!allAnswered || isSubmitting || isLoading}>
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Complete Quiz
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!isCurrentQuestionAnswered}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress dots */}
        <div className="mt-6 flex justify-center gap-2">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx < currentStep
                  ? 'bg-primary'
                  : idx === currentStep
                    ? 'bg-primary'
                    : answers.some((a) => a.questionId === questions[idx].id)
                      ? 'bg-primary/50'
                      : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
