'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Rocket, Brain, GraduationCap, User, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

type Step = 'welcome' | 'quiz' | 'recommendation' | 'profile';
type LearningPath = 'beginner' | 'intermediate' | 'advanced';

interface QuizQuestion {
  key: string;
  options: Array<{ key: string; value: number }>;
}

const QUESTIONS: QuizQuestion[] = [
  { key: 'q1', options: [{ key: 'q1a1', value: 0 }, { key: 'q1a2', value: 1 }, { key: 'q1a3', value: 2 }] },
  { key: 'q2', options: [{ key: 'q2a1', value: 0 }, { key: 'q2a2', value: 1 }, { key: 'q2a3', value: 2 }] },
  { key: 'q3', options: [{ key: 'q3a1', value: 0 }, { key: 'q3a2', value: 1 }, { key: 'q3a3', value: 2 }] },
  { key: 'q4', options: [{ key: 'q4a1', value: 0 }, { key: 'q4a2', value: 1 }, { key: 'q4a3', value: 2 }] },
  { key: 'q5', options: [{ key: 'q5a1', value: 0 }, { key: 'q5a2', value: 1 }, { key: 'q5a3', value: 2 }] },
];

const STEPS: Step[] = ['welcome', 'quiz', 'recommendation', 'profile'];

function getRecommendation(score: number): LearningPath {
  if (score <= 3) return 'beginner';
  if (score <= 6) return 'intermediate';
  return 'advanced';
}

const pathIcons: Record<LearningPath, React.ReactNode> = {
  beginner: <Rocket className="h-8 w-8 text-green-500" />,
  intermediate: <Brain className="h-8 w-8 text-yellow-500" />,
  advanced: <GraduationCap className="h-8 w-8 text-red-500" />,
};

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  const step = STEPS[currentStep] ?? 'welcome';
  const progressPercent = ((currentStep + 1) / STEPS.length) * 100;

  const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0);
  const recommendation = getRecommendation(totalScore);
  const currentQ: QuizQuestion | undefined = QUESTIONS[currentQuestion];

  const handleAnswer = (questionKey: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: parseInt(value, 10) }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setCurrentStep(2); // recommendation
    }
  };

  const handleFinish = () => {
    const result = {
      learningPath: recommendation,
      answers,
      score: totalScore,
      displayName,
      bio,
      completedAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('superteam-onboarding', JSON.stringify(result));
    }
    router.push('/courses');
  };

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <Progress value={progressPercent} className="h-2" />

        {step === 'welcome' && (
          <div className="space-y-6 text-center">
            <Sparkles className="mx-auto h-16 w-16 text-primary" />
            <h1 className="text-3xl font-bold">{t('welcome.title')}</h1>
            <p className="text-muted-foreground">{t('welcome.description')}</p>
            <Button size="lg" onClick={() => setCurrentStep(1)} className="w-full">
              {t('start')} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'quiz' && currentQ && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{t('quiz.title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('quiz.description')} ({currentQuestion + 1}/{QUESTIONS.length})
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <p className="mb-4 font-medium">
                {t(`questions.${currentQ.key}`)}
              </p>
              <RadioGroup
                value={answers[currentQ.key]?.toString() ?? ''}
                onValueChange={(v) => handleAnswer(currentQ.key, v)}
              >
                {currentQ.options.map((opt) => (
                  <div key={opt.key} className="flex items-center space-x-2 rounded-lg border p-3 transition-colors hover:bg-accent">
                    <RadioGroupItem value={opt.value.toString()} id={opt.key} />
                    <Label htmlFor={opt.key} className="flex-1 cursor-pointer">
                      {t(`questions.${opt.key}`)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentQuestion > 0) setCurrentQuestion((p) => p - 1);
                  else setCurrentStep(0);
                }}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> {t('previous')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleNextQuestion}
                disabled={answers[currentQ.key] === undefined}
              >
                {currentQuestion < QUESTIONS.length - 1 ? t('next') : t('next')} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'recommendation' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold">{t('recommendation.title')}</h2>
            <p className="text-muted-foreground">{t('recommendation.description')}</p>

            <div className="rounded-xl border-2 border-primary bg-card p-8">
              <div className="flex flex-col items-center gap-4">
                {pathIcons[recommendation]}
                <h3 className="text-xl font-bold">{t(`recommendation.${recommendation}`)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(`recommendation.${recommendation}Desc`)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setCurrentStep(1); setCurrentQuestion(0); }}>
                <ChevronLeft className="mr-2 h-4 w-4" /> {t('previous')}
              </Button>
              <Button className="flex-1" onClick={() => setCurrentStep(3)}>
                {t('next')} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'profile' && (
          <div className="space-y-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-2 text-2xl font-bold">{t('profile.title')}</h2>
              <p className="text-muted-foreground">{t('profile.description')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="display-name">{t('profile.displayName')}</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('profile.displayName')}
                />
              </div>
              <div>
                <Label htmlFor="bio">{t('profile.bio')}</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('profile.bio')}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> {t('previous')}
              </Button>
              <Button className="flex-1" onClick={handleFinish}>
                {t('finish')} <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
