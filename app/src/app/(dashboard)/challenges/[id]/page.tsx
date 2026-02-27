'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { CodeChallenge } from '@/components/editor';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  AlertCircle,
  BookOpen,
  Trophy,
  Clock,
  Star,
  Sparkles,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { ChallengeValidation, TestCase } from '@/lib/services/code-execution-service';
import confetti from 'canvas-confetti';

interface ChallengeData {
  id: string;
  slug: string;
  title: string;
  description: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  xpReward: number;
  timeEstimate: number;
  language: 'typescript' | 'javascript' | 'rust';
  starterCode: string;
  solutionCode: string;
  testCases: TestCase[];
  functionName?: string;
  hints?: string[];
  tags?: string[];
  courseId?: string;
  lessonId?: string;
}

interface ChallengeProgress {
  completed: boolean;
  completedAt?: string;
  attempts: number;
  bestTimeMs?: number;
  codeSubmitted?: string;
  testsPassed: number;
  testsTotal: number;
  xpEarned: number;
}

export default function ChallengeSolvePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isThreeColumnChallenge = id === 'challenge-two-sum';
  const router = useRouter();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const markChallengesAsSeen = async () => {
      try {
        const response = await fetch('/api/challenges/status');

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data.latestChallengeCreatedAt) {
          localStorage.setItem('lastSeenChallengeCreatedAt', data.latestChallengeCreatedAt);
        }
      } catch (err) {
        console.error('Error marking challenges as seen:', err);
      }
    };

    markChallengesAsSeen();
  }, []);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/challenges/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch challenge');
        }

        setChallenge(data.challenge);
        setProgress(data.progress);
      } catch (err) {
        console.error('Error fetching challenge:', err);
        setError(err instanceof Error ? err.message : 'Failed to load challenge');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id]);

  const handleComplete = useCallback(
    async (code: string, results: ChallengeValidation) => {
      if (!challenge || isCompleting) return;

      setIsCompleting(true);

      try {
        const response = await fetch('/api/challenges/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeId: challenge.id,
            code,
            testsPassed: results.passedCount,
            testsTotal: results.results.length,
            executionTimeMs: results.totalTime,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to complete challenge');
        }

        // Trigger celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#32CD32', '#00BFFF'],
        });

        if (data.firstCompletion) {
          toast.success(
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-semibold">Challenge Completed!</p>
                <p className="text-sm">+{data.xpAwarded} XP earned</p>
              </div>
            </div>
          );
        } else {
          toast.success('Challenge completed again! Great practice!');
        }

        setProgress(data.progress);
      } catch (err) {
        console.error('Error completing challenge:', err);
        toast.error('Failed to save progress. Please try again.');
      } finally {
        setIsCompleting(false);
      }
    },
    [challenge, isCompleting]
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
      case 'hard':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="mb-4 h-24 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="container max-w-6xl py-8">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="text-destructive h-12 w-12" />
            <div className="text-center">
              <p className="text-destructive mb-2 text-lg font-medium">
                {error || 'Challenge not found'}
              </p>
              <p className="text-muted-foreground mb-6">
                The challenge you&apos;re looking for doesn&apos;t exist or you don&apos;t have
                access.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/challenges">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Challenges
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('container py-8', isThreeColumnChallenge ? 'max-w-[1500px]' : 'max-w-6xl')}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/challenges">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <BookOpen className="h-3 w-3" />
                {challenge.category}
              </Badge>
              {progress?.completed && (
                <Badge className="gap-1 bg-green-500">
                  <Trophy className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
            {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {challenge.timeEstimate} min
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3 text-yellow-500" />+{challenge.xpReward} XP
          </Badge>
        </div>
      </div>

      {/* Stats */}
      {progress && progress.attempts > 0 && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Attempts:</span>
                <span className="font-medium">{progress.attempts}</span>
              </div>
              {progress.bestTimeMs && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Best Time:</span>
                  <span className="font-medium">{progress.bestTimeMs.toFixed(0)}ms</span>
                </div>
              )}
              {progress.xpEarned > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{progress.xpEarned} XP earned</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenge Component */}
      <CodeChallenge
        title={challenge.title}
        prompt={challenge.prompt || challenge.description}
        starterCode={progress?.codeSubmitted || challenge.starterCode}
        solution={challenge.solutionCode}
        language={challenge.language}
        testCases={challenge.testCases}
        hints={challenge.hints}
        functionName={challenge.functionName}
        xpReward={challenge.xpReward}
        difficulty={
          challenge.difficulty === 'easy'
            ? 'beginner'
            : challenge.difficulty === 'hard'
              ? 'advanced'
              : 'intermediate'
        }
        timeEstimate={challenge.timeEstimate}
        onComplete={handleComplete}
        initialCompleted={progress?.completed}
        layout={isThreeColumnChallenge ? 'three-column' : 'stacked'}
        className="shadow-lg"
      />

      {/* Related course link */}
      {challenge.courseId && (
        <Card className="mt-6">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <BookOpen className="text-primary h-5 w-5" />
              <span className="text-sm">This challenge is part of a course</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/courses/${challenge.courseId}`}>View Course</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
