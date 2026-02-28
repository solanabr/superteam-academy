'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { QuizStep } from '@/components/onboarding/quiz-step';
import { ExperienceStep } from '@/components/onboarding/experience-step';
import { ProgrammingStep } from '@/components/onboarding/programming-step';
import { InterestsStep } from '@/components/onboarding/interests-step';
import { GoalsStep } from '@/components/onboarding/goals-step';
import { ResultsStep } from '@/components/onboarding/results-step';
import {
  getRecommendation,
  type ExperienceLevel,
  type ProgrammingLanguage,
  type Interest,
  type Goal,
  type Recommendation,
} from '@/lib/utils/recommendation';

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const [step, setStep] = useState(1);

  // Quiz state
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);

  // Results
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Determine if the current step can proceed
  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return experience !== null;
      case 2:
        return languages.length > 0;
      case 3:
        return interests.length > 0;
      case 4:
        return goal !== null;
      default:
        return false;
    }
  }, [step, experience, languages, interests, goal]);

  function handleNext() {
    if (step === TOTAL_STEPS - 1) {
      // Last question step — compute results
      if (experience && goal) {
        const result = getRecommendation({
          experience,
          languages,
          interests,
          goal,
        });
        setRecommendation(result);
        setShowResults(true);
      }
      return;
    }

    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (showResults) {
      setShowResults(false);
      return;
    }
    if (step > 1) {
      setStep((s) => s - 1);
    }
  }

  const stepTitles = [
    t('step_experience_title'),
    t('step_languages_title'),
    t('step_interests_title'),
    t('step_goals_title'),
  ];

  if (showResults && recommendation) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-xl">
          <CardContent className="p-6 sm:p-8">
            <h1 className="mb-6 text-center text-2xl font-bold tracking-tight">
              {t('results_title')}
            </h1>
            <ResultsStep recommendation={recommendation} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-xl">
        <CardContent className="p-6 sm:p-8">
          <QuizStep
            step={step}
            totalSteps={TOTAL_STEPS}
            title={stepTitles[step - 1] ?? ''}
            onNext={handleNext}
            onBack={handleBack}
            canProceed={canProceed}
            isFirstStep={step === 1}
            isLastStep={step === TOTAL_STEPS - 1}
          >
            {step === 1 && (
              <ExperienceStep value={experience} onChange={setExperience} />
            )}
            {step === 2 && (
              <ProgrammingStep value={languages} onChange={setLanguages} />
            )}
            {step === 3 && (
              <InterestsStep value={interests} onChange={setInterests} />
            )}
            {step === 4 && (
              <GoalsStep value={goal} onChange={setGoal} />
            )}
          </QuizStep>
        </CardContent>
      </Card>
    </div>
  );
}
