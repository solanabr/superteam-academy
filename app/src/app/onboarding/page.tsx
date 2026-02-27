'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SkillAssessmentQuiz } from '@/components/onboarding/skill-assessment-quiz';
import { ProfileSetupWizard } from '@/components/onboarding/profile-setup-wizard';
import { LearningPathRecommendation } from '@/components/onboarding/learning-path-recommendation';
import { useSession } from 'next-auth/react';

type OnboardingStep = 'welcome' | 'assessment' | 'profile' | 'learning-path';

interface QuizQuestion {
  id: string;
  question: string;
  options: Array<{ text: string }>;
}

interface OnboardingProgress {
  started: boolean;
  assessmentComplete: boolean;
  profileSetupComplete: boolean;
  achievementUnlocked: boolean;
  interests?: string[];
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  learningPath?: string;
  learningPathData?: {
    id: string;
    name: string;
    description: string;
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    courses: string[];
    duration: string;
    difficulty: string;
  } | null;
  completedAt?: string | Date;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  useEffect(() => {
    if (!showSuccessModal) return;

    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showSuccessModal]);

  useEffect(() => {
    if (showSuccessModal && redirectCountdown === 0) {
      router.replace('/dashboard');
    }
  }, [showSuccessModal, redirectCountdown, router]);

  // Fetch quiz questions and check progress
  useEffect(() => {
    const checkProgressAndFetchQuiz = async () => {
      try {
        const [quizRes, progressRes] = await Promise.all([
          fetch('/api/onboarding/quiz'),
          fetch('/api/onboarding/complete'),
        ]);

        const quizData = await quizRes.json();
        setQuizQuestions(quizData.quiz);

        const progressData = (await progressRes.json()) as OnboardingProgress;

        if (progressData.completedAt) {
          router.replace('/dashboard');
          return;
        }

        if (progressData.assessmentComplete && progressData.profileSetupComplete) {
          if (progressData.learningPathData && progressData.skillLevel) {
            setAssessmentResult({
              learningPath: progressData.learningPathData,
              skillLevel: progressData.skillLevel,
              session: {
                interests: progressData.interests || [],
              },
            });
          }
          setStep('learning-path');
        } else if (progressData.assessmentComplete) {
          setStep('profile');
        } else {
          setStep('welcome');
        }
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      checkProgressAndFetchQuiz();
    }
  }, [session, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('auth.signin.title')}</CardTitle>
            <CardDescription>{t('auth.signin.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/auth/signin')} className="w-full">
              {t('nav.signIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Welcome Step
  if (step === 'welcome') {
    return (
      <div className="from-primary/5 to-primary/5 flex min-h-screen items-center justify-center bg-gradient-to-br via-transparent p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">{t('onboarding.welcome.title')}</CardTitle>
            <CardDescription className="mt-2 text-lg">
              Let&apos;s get you set up for success in Web3 development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Skill Assessment',
                  description: 'Answer 5 quick questions about your experience',
                },
                {
                  step: '2',
                  title: 'Profile Setup',
                  description: 'Tell the community about yourself',
                },
                {
                  step: '3',
                  title: 'Learning Path',
                  description: 'Get personalized course recommendations',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="hover:bg-muted/50 rounded-lg border p-4 text-center transition"
                >
                  <div className="bg-primary/20 text-primary mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                ✨ Complete the onboarding to unlock your first achievement and earn 100 XP!
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Skip for now
              </Button>
              <Button onClick={() => setStep('assessment')} className="flex-1">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assessment Step
  if (step === 'assessment') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 py-12">
        <div className="w-full">
          <SkillAssessmentQuiz
            questions={quizQuestions}
            isLoading={isProcessing}
            onComplete={async (answers) => {
              setIsProcessing(true);
              try {
                const res = await fetch('/api/onboarding/assessment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ answers }),
                });

                if (!res.ok) throw new Error('Failed to submit assessment');

                const data = await res.json();
                setAssessmentResult(data);
                setStep('profile');
              } catch (error) {
                console.error('Error submitting assessment:', error);
              } finally {
                setIsProcessing(false);
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Profile Setup Step
  if (step === 'profile') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 py-12">
        <div className="w-full">
          <ProfileSetupWizard
            userName={session.user.name || 'User'}
            isLoading={isProcessing}
            onComplete={async (profile) => {
              setIsProcessing(true);
              try {
                const res = await fetch('/api/onboarding/profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(profile),
                });

                if (!res.ok) throw new Error('Failed to save profile');

                setStep('learning-path');
              } catch (error) {
                console.error('Error saving profile:', error);
              } finally {
                setIsProcessing(false);
              }
            }}
            onSkip={async () => {
              setIsProcessing(true);
              try {
                const res = await fetch('/api/onboarding/profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ skip: true }),
                });

                if (!res.ok) throw new Error('Failed to skip profile setup');

                setStep('learning-path');
              } catch (error) {
                console.error('Error skipping profile setup:', error);
              } finally {
                setIsProcessing(false);
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Learning Path Step
  if (step === 'learning-path') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 py-12">
        <div className="w-full space-y-6">
          {assessmentResult && (
            <>
              <LearningPathRecommendation
                learningPath={assessmentResult.learningPath}
                skillLevel={assessmentResult.skillLevel}
                interests={assessmentResult.session?.interests || []}
              />
              <div className="mx-auto flex max-w-2xl justify-center">
                <Button
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      const res = await fetch('/api/onboarding/complete', {
                        method: 'POST',
                      });

                      if (!res.ok) throw new Error('Failed to complete onboarding');

                      const data = await res.json();

                      if (data.onboardingComplete || data.success) {
                        setRedirectCountdown(5);
                        setShowSuccessModal(true);
                        return;
                      }

                      console.warn('Onboarding completion returned without completion flag');
                    } catch (error) {
                      console.error('Error completing onboarding:', error);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Trophy className="mr-2 h-4 w-4" />
                      Claim Achievement
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        <Dialog open={showSuccessModal} onOpenChange={() => {}}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">🎉 Achievement Claimed!</DialogTitle>
              <DialogDescription className="text-center text-base">
                You have successfully claimed your first 100 XP.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-center">
              <p className="text-muted-foreground text-sm">
                You would be redirected to your dashboard now.
              </p>
              <p className="text-primary text-lg font-semibold">
                Redirecting in {redirectCountdown}s...
              </p>
              <Button onClick={() => router.replace('/dashboard')} className="w-full">
                Go to Dashboard Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
