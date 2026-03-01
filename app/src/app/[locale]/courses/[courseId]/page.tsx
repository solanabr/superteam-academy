'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { LessonView } from '@/components/courses/lesson-view';
import { useCourses, useEnrollmentProgress } from '@/lib/hooks/use-courses';
import { DIFFICULTY_LABELS, TRACK_LABELS } from '@/lib/solana/constants';
import { getDifficultyColor, formatXp } from '@/lib/utils';
import {
  BookOpen,
  Sparkles,
  Users,
  Lock,
  Check,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type { SanityLesson } from '@/types';

// Demo lessons for when Sanity isn't configured
const DEMO_LESSONS: SanityLesson[] = [
  {
    _key: '1',
    title: 'What is Solana?',
    content: '<p>Solana is a high-performance blockchain platform designed for decentralized applications and crypto-currencies. It uses a unique consensus mechanism called Proof of History (PoH) combined with Proof of Stake (PoS).</p><h3>Key Features</h3><ul><li><strong>Speed:</strong> 400ms block times with up to 65,000 TPS</li><li><strong>Low Cost:</strong> Average transaction fee ~$0.00025</li><li><strong>Composability:</strong> All programs on a single global state</li></ul>',
    quiz: {
      question: 'What consensus mechanism does Solana use?',
      options: [
        'Proof of Work',
        'Proof of History + Proof of Stake',
        'Delegated Proof of Stake',
        'Proof of Authority',
      ],
      correctIndex: 1,
    },
  },
  {
    _key: '2',
    title: 'The Accounts Model',
    content: '<p>Everything on Solana is an account. Programs, tokens, NFTs, user data — all accounts. Understanding the accounts model is fundamental to Solana development.</p><h3>Account Types</h3><ul><li><strong>System Accounts:</strong> Regular wallet accounts</li><li><strong>Program Accounts:</strong> Executable code (immutable data)</li><li><strong>Data Accounts:</strong> State owned by programs</li></ul><h3>Key Concepts</h3><p>Each account has an <code>owner</code> field. Only the owner program can modify the account\'s data. Accounts must pay <strong>rent</strong> (or be rent-exempt by holding minimum SOL).</p>',
    quiz: {
      question: 'Who can modify an account\'s data on Solana?',
      options: [
        'Anyone with SOL',
        'The account owner only',
        'Only the system program',
        'Any program can modify any account',
      ],
      correctIndex: 1,
    },
  },
  {
    _key: '3',
    title: 'Program Derived Addresses (PDAs)',
    content: '<p>PDAs are deterministic addresses derived from a program ID and seeds. They don\'t have a private key — only the program can sign for them.</p><h3>PDA Derivation</h3><pre><code>const [pda, bump] = PublicKey.findProgramAddressSync(\n  [Buffer.from("seed"), user.toBuffer()],\n  programId\n);</code></pre><p>PDAs are essential for:</p><ul><li>Storing program state</li><li>Creating deterministic account addresses</li><li>Cross-program invocations (CPIs)</li></ul>',
    codeChallenge: {
      starterCode: '// Derive a PDA with seeds ["config"]\nconst [configPda] = PublicKey.findProgramAddressSync(\n  [Buffer.from("TODO")],\n  PROGRAM_ID\n);',
      solution: '// Derive a PDA with seeds ["config"]\nconst [configPda] = PublicKey.findProgramAddressSync(\n  [Buffer.from("config")],\n  PROGRAM_ID\n);',
      language: 'typescript' as const,
      instructions: 'Replace "TODO" with the correct seed to derive the config PDA.',
    },
  },
];

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const t = useTranslations('courses');
  const tl = useTranslations('lesson');
  const tc = useTranslations('common');
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { courses } = useCourses();
  const { progress } = useEnrollmentProgress(courseId);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [lessons] = useState<SanityLesson[]>(DEMO_LESSONS);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  const course = courses.find((c) => c.courseId === courseId);

  useEffect(() => {
    if (progress) {
      setIsEnrolled(true);
      setCompletedLessons(new Set(progress.completedLessons));
    }
  }, [progress]);

  const handleEnroll = useCallback(async () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    setEnrolling(true);
    // Stub: in production, build and sign enroll tx
    setTimeout(() => {
      setIsEnrolled(true);
      setEnrolling(false);
    }, 1500);
  }, [connected, setVisible]);

  const handleCompleteLesson = useCallback(() => {
    setCompletedLessons((prev) => new Set([...Array.from(prev), currentLesson]));
  }, [currentLesson]);

  if (!course) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-solana-purple" />
      </div>
    );
  }

  const totalXp = course.xpPerLesson * course.lessonCount;
  const bonusXp = Math.floor(totalXp / 2);
  const progressPercent =
    lessons.length > 0 ? (completedLessons.size / lessons.length) * 100 : 0;

  return (
    <div className="container py-8 md:py-12">
      {/* Back link */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc('back')}
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                {DIFFICULTY_LABELS[course.difficulty]}
              </Badge>
              {course.trackId > 0 && (
                <Badge variant="secondary">
                  {TRACK_LABELS[course.trackId] || `Track ${course.trackId}`}
                </Badge>
              )}
              {course.prerequisite && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  {t('prerequisite', { prerequisite: course.prerequisite })}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">{course.description}</p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {course.lessonCount} {t('lessons')}
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-xp-gold" />
                {formatXp(totalXp + bonusXp)} XP
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {t('completions', { count: course.totalCompletions })}
              </span>
            </div>
          </div>

          {isEnrolled ? (
            <>
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{t('progress', { percent: Math.round(progressPercent) })}</span>
                  <span className="text-muted-foreground">
                    {completedLessons.size}/{lessons.length} {t('lessons')}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <Separator />

              {/* Current lesson */}
              {lessons[currentLesson] && (
                <LessonView
                  lesson={lessons[currentLesson]}
                  lessonIndex={currentLesson}
                  isCompleted={completedLessons.has(currentLesson)}
                  xpPerLesson={course.xpPerLesson}
                  onComplete={handleCompleteLesson}
                  onNext={() => setCurrentLesson((p) => Math.min(p + 1, lessons.length - 1))}
                  isLast={currentLesson === lessons.length - 1}
                />
              )}
            </>
          ) : (
            <Card className="border-solana-purple/30">
              <CardContent className="py-12 text-center space-y-4">
                <GraduationCap className="h-12 w-12 mx-auto text-solana-purple" />
                <h3 className="text-xl font-semibold">Ready to start?</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Enroll to start learning. Your progress is tracked on-chain and you&apos;ll earn
                  XP for each completed lesson.
                </p>
                <Button
                  variant="solana"
                  size="lg"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {connected ? t('enroll') : tc('connectWallet')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lesson list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {lessons.map((lesson, idx) => (
                <button
                  key={lesson._key}
                  onClick={() => isEnrolled && setCurrentLesson(idx)}
                  disabled={!isEnrolled}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                    currentLesson === idx && isEnrolled
                      ? 'bg-solana-purple/10 text-solana-purple'
                      : 'hover:bg-muted'
                  } ${!isEnrolled ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      completedLessons.has(idx)
                        ? 'bg-solana-green text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {completedLessons.has(idx) ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="truncate">{lesson.title}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Course info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Course Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">XP per lesson</span>
                <span className="font-medium">{course.xpPerLesson} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion bonus</span>
                <span className="font-medium">{formatXp(bonusXp)} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total XP</span>
                <span className="font-medium text-xp-gold">{formatXp(totalXp + bonusXp)} XP</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credential</span>
                <span className="font-medium">Soulbound NFT</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GraduationCap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  );
}
