'use client';

import { useState, useMemo, useCallback, lazy, Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogoLoader } from '@/components/ui/logo-loader';
import { VideoPlayer } from '@/components/ui/video-player';
import { LessonProgressTracker } from '@/components/ui/lesson-progress-tracker';
import { Callout, CodeBlock } from '@/components/mdx';
import { SplitLayout } from '@/components/editor/split-layout';
import { executeCode, executeRustCode } from '@/lib/services/code-execution-service';
import { useGamification } from '@/hooks/useGamification';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  Lightbulb,
  Zap,
  Loader2,
  Code2,
  RotateCcw,
  Play,
  Trash2,
} from 'lucide-react';

// Lazy load CodeChallenge for better initial load
const CodeChallenge = lazy(() =>
  import('@/components/editor/code-challenge').then((mod) => ({ default: mod.CodeChallenge }))
);

const CodeEditor = lazy(() =>
  import('@/components/editor/code-editor').then((mod) => ({ default: mod.CodeEditor }))
);

// Interface for parsed challenge data
interface ChallengeData {
  title?: string;
  prompt: string;
  language: 'typescript' | 'javascript' | 'rust';
  starterCode: string;
  solution: string;
  testCases: Array<{
    id: string;
    description: string;
    input?: unknown;
    expectedOutput: unknown;
    hidden?: boolean;
  }>;
  hints: string[];
  xpReward: number;
}

// Parse ChallengeBlock from MDX content
function parseChallengeBlock(content: string): ChallengeData | null {
  const challengeMatch = content.match(/<ChallengeBlock[\s\S]*?\/>/);
  if (!challengeMatch) return null;

  const block = challengeMatch[0];

  // Extract props using regex
  const extractProp = (name: string): string => {
    // Match prop={`...`} or prop="..."
    const templateMatch = block.match(new RegExp(`${name}=\\{\\\`([\\s\\S]*?)\\\`\\}`));
    if (templateMatch) return templateMatch[1];

    const stringMatch = block.match(new RegExp(`${name}="([^"]*)"`));
    if (stringMatch) return stringMatch[1];

    return '';
  };

  // Extract array props like testCases and hints
  const extractArrayProp = (name: string): string => {
    const match = block.match(new RegExp(`${name}=\\{(\\[[\\s\\S]*?\\])\\}`));
    return match ? match[1] : '[]';
  };

  // Parse testCases
  let testCases: ChallengeData['testCases'] = [];
  try {
    const testCasesStr = extractArrayProp('testCases');
    // Convert to valid JSON by handling unquoted keys
    const jsonStr = testCasesStr.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
    const parsed = JSON.parse(jsonStr);
    testCases = parsed.map(
      (
        tc: { description: string; input?: string; expectedOutput: string; hidden?: boolean },
        i: number
      ) => ({
        id: `test-${i}`,
        description: tc.description,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        hidden: tc.hidden,
      })
    );
  } catch {
    // Fallback: create simple test cases based on solution check
    testCases = [
      { id: 'test-0', description: 'Code compiles successfully', expectedOutput: true },
      { id: 'test-1', description: 'Function returns expected value', expectedOutput: true },
    ];
  }

  // Parse hints
  let hints: string[] = [];
  try {
    const hintsStr = extractArrayProp('hints');
    const jsonStr = hintsStr.replace(/'/g, '"');
    hints = JSON.parse(jsonStr);
  } catch {
    hints = [];
  }

  // Extract xpReward
  const xpMatch = block.match(/xpReward=\{?(\d+)\}?/);
  const xpReward = xpMatch ? parseInt(xpMatch[1]) : 50;

  return {
    title: extractProp('title') || 'Coding Challenge',
    prompt: extractProp('prompt'),
    language: (extractProp('language') || 'typescript') as 'typescript' | 'javascript' | 'rust',
    starterCode: extractProp('starterCode'),
    solution: extractProp('solution'),
    testCases,
    hints,
    xpReward,
  };
}

// Remove ChallengeBlock from content for display
function removeChallenge(content: string): string {
  return content.replace(/<ChallengeBlock[\s\S]*?\/>/, '').trim();
}

// Simple MDX-like renderer for lesson content
function MDXContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;
  let codeBlock: { language: string; lines: string[] } | null = null;

  // Helper to process inline formatting
  const processInline = (text: string, key: string | number): React.ReactNode => {
    let remaining = text;
    const result: React.ReactNode[] = [];
    let idx = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Inline code `code`
      const codeMatch = remaining.match(/`([^`]+)`/);

      const matches = [
        boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
        codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index! } : null,
      ]
        .filter(Boolean)
        .sort((a, b) => a!.index - b!.index);

      if (matches.length === 0) {
        result.push(remaining);
        break;
      }

      const first = matches[0]!;
      if (first.index > 0) {
        result.push(remaining.slice(0, first.index));
      }

      if (first.type === 'bold') {
        result.push(
          <strong key={`${key}-${idx++}`} className="font-semibold">
            {first.match[1]}
          </strong>
        );
        remaining = remaining.slice(first.index + first.match[0].length);
      } else if (first.type === 'code') {
        result.push(
          <code
            key={`${key}-${idx++}`}
            className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm"
          >
            {first.match[1]}
          </code>
        );
        remaining = remaining.slice(first.index + first.match[0].length);
      }
    }

    return result.length === 1 && typeof result[0] === 'string' ? result[0] : <>{result}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.startsWith('```')) {
      if (codeBlock) {
        // End code block
        elements.push(
          <CodeBlock
            key={currentIndex++}
            language={codeBlock.language || 'text'}
            code={codeBlock.lines.join('\n')}
          />
        );
        codeBlock = null;
      } else {
        // Start code block
        const language = line.slice(3).trim();
        codeBlock = { language, lines: [] };
      }
      continue;
    }

    if (codeBlock) {
      codeBlock.lines.push(line);
      continue;
    }

    // Handle JSX component blocks like <Callout>
    const calloutMatch = line.match(/<Callout\s+type="(\w+)"\s+title="([^"]+)">/);
    if (calloutMatch) {
      // Find closing tag
      let j = i + 1;
      const contentLines: string[] = [];
      while (j < lines.length && !lines[j].includes('</Callout>')) {
        contentLines.push(lines[j]);
        j++;
      }
      elements.push(
        <Callout
          key={currentIndex++}
          type={calloutMatch[1] as 'info' | 'warning' | 'error' | 'success' | 'tip'}
          title={calloutMatch[2]}
        >
          {contentLines.join('\n')}
        </Callout>
      );
      i = j;
      continue;
    }

    // Handle Quiz and ChallengeBlock (skip for simplified renderer)
    if (line.includes('<Quiz') || line.includes('<ChallengeBlock')) {
      while (i < lines.length && !lines[i].includes('/>')) {
        i++;
      }
      continue;
    }

    // Skip empty lines at the start
    if (line.trim() === '') {
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={currentIndex++}
          className="mt-8 scroll-m-20 text-4xl font-bold tracking-tight first:mt-0"
        >
          {processInline(line.slice(2), currentIndex)}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={currentIndex++}
          className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0"
        >
          {processInline(line.slice(3), currentIndex)}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={currentIndex++} className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
          {processInline(line.slice(4), currentIndex)}
        </h3>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={currentIndex++} className="mt-6 scroll-m-20 text-xl font-semibold tracking-tight">
          {processInline(line.slice(5), currentIndex)}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={currentIndex++}
          className="border-primary text-muted-foreground mt-6 border-l-4 pl-6 italic"
        >
          {processInline(line.slice(2), currentIndex)}
        </blockquote>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={currentIndex++} className="my-8 border-t" />);
      continue;
    }

    // Unordered list
    if (line.startsWith('- ')) {
      const listItems: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length && lines[j].startsWith('- ')) {
        listItems.push(
          <li key={j} className="leading-7">
            {processInline(lines[j].slice(2), j)}
          </li>
        );
        j++;
      }
      elements.push(
        <ul key={currentIndex++} className="my-6 ml-6 list-disc [&>li]:mt-2">
          {listItems}
        </ul>
      );
      i = j - 1;
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const listItems: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length && lines[j].match(/^\d+\. /)) {
        listItems.push(
          <li key={j} className="leading-7">
            {processInline(lines[j].replace(/^\d+\. /, ''), j)}
          </li>
        );
        j++;
      }
      elements.push(
        <ol key={currentIndex++} className="my-6 ml-6 list-decimal [&>li]:mt-2">
          {listItems}
        </ol>
      );
      i = j - 1;
      continue;
    }

    // Paragraph
    if (line.trim()) {
      elements.push(
        <p key={currentIndex++} className="leading-7 [&:not(:first-child)]:mt-6">
          {processInline(line, currentIndex)}
        </p>
      );
    }
  }

  return <div className="prose prose-neutral dark:prose-invert max-w-none">{elements}</div>;
}

export default function LessonPage() {
  const params = useParams();
  const { data: session } = useSession();
  const regularLessonContentRef = useRef<HTMLDivElement>(null);
  const [showHints, setShowHints] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [lessonData, setLessonData] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lessonEditorCode, setLessonEditorCode] = useState('');
  const [isLessonCodeRunning, setIsLessonCodeRunning] = useState(false);
  const [lessonCodeOutput, setLessonCodeOutput] = useState<{
    success: boolean;
    output: unknown;
    logs: string[];
    executionTime: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const fetchLessonData = async () => {
      if (typeof params.slug !== 'string' || typeof params.id !== 'string') return;

      // Reset challenge state when lesson changes
      setChallengeCompleted(false);
      setIsCompleted(false);

      try {
        const [lessonResponse, courseResponse] = await Promise.all([
          fetch(`/api/courses/${params.slug}/lessons/${params.id}`),
          fetch(`/api/courses/${params.slug}`),
        ]);

        if (lessonResponse.ok) {
          const lessonPayload = await lessonResponse.json();
          setLessonData(lessonPayload);
        } else {
          setLessonData(null);
        }

        if (courseResponse.ok) {
          const coursePayload = await courseResponse.json();
          setCourse(coursePayload.course);
        } else {
          setCourse(null);
        }
      } catch (error) {
        console.error('Failed to load lesson:', error);
        setLessonData(null);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [params.slug, params.id]);

  // Build flat list of all lessons for navigation
  const allLessons = useMemo(() => {
    if (!course) return [];
    return course.modules.flatMap((module: any) =>
      module.lessons.map((lesson: any) => ({
        ...lesson,
        moduleTitle: module.title,
      }))
    );
  }, [course]);

  const moduleOverview = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.map((module: any) => ({
      id: module.id,
      title: module.title,
      lessons: module.lessons || [],
    }));
  }, [course]);

  // Parse challenge data from content or use stored challenge config
  const challengeData = useMemo(() => {
    if (!lessonData || lessonData.lesson.type !== 'challenge') return null;

    // First check if lesson has a stored challenge config (from admin)
    if (lessonData.lesson.challenge) {
      const challenge = lessonData.lesson.challenge;
      return {
        title: lessonData.lesson.title,
        prompt: challenge.prompt,
        language: challenge.language as 'typescript' | 'javascript' | 'rust',
        starterCode: challenge.starterCode,
        solution: challenge.solution,
        testCases: challenge.testCases.map((tc: any, i: number) => ({
          id: tc.id || `test-${i}`,
          description: tc.description,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          hidden: tc.hidden,
        })),
        hints: lessonData.lesson.hints || [],
        xpReward: lessonData.lesson.xpReward || 50,
        difficulty: challenge.difficulty,
        timeEstimate: challenge.timeEstimate,
        functionName: challenge.functionName,
      };
    }

    // Fallback: parse from MDX content (legacy support)
    return parseChallengeBlock(lessonData.lesson.content);
  }, [lessonData]);

  // Content without challenge block for display
  const displayContent = useMemo(() => {
    if (!lessonData) return '';
    if (challengeData && !lessonData.lesson.challenge) {
      // Only remove challenge block if it was parsed from content
      return removeChallenge(lessonData.lesson.content);
    }
    return lessonData.lesson.content;
  }, [lessonData, challengeData]);

  const regularLessonEditorLanguage = useMemo(() => {
    const languageMatch = displayContent.match(/```(\w+)/);
    const language = (languageMatch?.[1] || 'typescript').toLowerCase();

    if (language === 'rust') return 'rust';
    if (language === 'javascript' || language === 'js') return 'javascript';
    if (language === 'json') return 'json';
    return 'typescript';
  }, [displayContent]);

  const lessonEditorStorageKey = useMemo(() => {
    if (typeof params.slug !== 'string' || typeof params.id !== 'string') return null;
    return `lesson-editor-${params.slug}-${params.id}`;
  }, [params.slug, params.id]);

  useEffect(() => {
    if (!lessonEditorStorageKey || typeof window === 'undefined') return;

    const savedCode = localStorage.getItem(lessonEditorStorageKey);
    if (savedCode !== null) {
      setLessonEditorCode(savedCode);
      return;
    }

    setLessonEditorCode(
      regularLessonEditorLanguage === 'rust'
        ? '// Practice Rust snippets here\nfn main() {\n    println!("Hello, Solana!");\n}'
        : '// Practice your lesson code here\n'
    );
  }, [lessonEditorStorageKey, regularLessonEditorLanguage]);

  useEffect(() => {
    if (!lessonEditorStorageKey || typeof window === 'undefined') return;

    const saveTimeout = setTimeout(() => {
      localStorage.setItem(lessonEditorStorageKey, lessonEditorCode);
    }, 400);

    return () => clearTimeout(saveTimeout);
  }, [lessonEditorStorageKey, lessonEditorCode]);

  const handleRunLessonCode = useCallback(async () => {
    const code = lessonEditorCode.trim();
    if (!code) {
      toast.error('Write some code before running');
      return;
    }

    setIsLessonCodeRunning(true);
    setLessonCodeOutput(null);

    try {
      if (regularLessonEditorLanguage === 'rust') {
        const rustResult = await executeRustCode(code, [
          {
            id: 'practice-rust-check',
            description: 'Rust snippet validation',
            expectedOutput: 'Compilation successful',
          },
        ]);

        const failed = rustResult.results.find((result) => !result.passed);
        const output = rustResult.results[0]?.actualOutput || 'Compilation successful';
        const error = failed?.error || (!rustResult.allPassed ? String(output) : undefined);

        setLessonCodeOutput({
          success: rustResult.allPassed,
          output,
          logs: [],
          executionTime: rustResult.totalTime,
          error,
        });

        if (rustResult.allPassed) {
          toast.success('Rust validation completed');
        } else {
          toast.error('Rust validation failed');
        }

        return;
      }

      if (regularLessonEditorLanguage === 'json') {
        const parsed = JSON.parse(code);
        setLessonCodeOutput({
          success: true,
          output: parsed,
          logs: [],
          executionTime: 0,
        });
        toast.success('JSON parsed successfully');
        return;
      }

      const result = await executeCode(
        code,
        regularLessonEditorLanguage === 'javascript' ? 'javascript' : 'typescript'
      );

      setLessonCodeOutput(result);

      if (result.success) {
        toast.success('Code executed');
      } else {
        toast.error('Code execution failed');
      }
    } catch (error) {
      setLessonCodeOutput({
        success: false,
        output: undefined,
        logs: [],
        executionTime: 0,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Error while running code');
    } finally {
      setIsLessonCodeRunning(false);
    }
  }, [lessonEditorCode, regularLessonEditorLanguage]);

  const handleResetLessonEditor = useCallback(() => {
    setLessonEditorCode(
      regularLessonEditorLanguage === 'rust'
        ? '// Practice Rust snippets here\nfn main() {\n    println!("Hello, Solana!");\n}'
        : '// Practice your lesson code here\n'
    );
    setLessonCodeOutput(null);
    toast.info('Practice editor reset');
  }, [regularLessonEditorLanguage]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!session?.user?.id || !course?.id || !lessonData?.lesson?.slug) return;

      try {
        // Fetch course progress and lesson-specific progress in parallel
        const [courseResponse, lessonResponse] = await Promise.all([
          fetch(`/api/progress?userId=${session.user.id}&courseId=${course.id}`),
          fetch(
            `/api/progress/lesson?userId=${session.user.id}&courseId=${course.id}&lessonId=${lessonData.lesson.slug}`
          ),
        ]);

        if (courseResponse.ok) {
          const data = await courseResponse.json();
          if (data.progress) {
            setCompletedLessonsCount(data.progress.lessonsCompleted || 0);
          }
        }

        // Check if this specific lesson is already completed
        if (lessonResponse.ok) {
          const lessonProgress = await lessonResponse.json();
          if (lessonProgress.completed) {
            setIsCompleted(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch lesson progress:', error);
      }
    };

    fetchProgress();
  }, [session?.user?.id, course?.id, lessonData?.lesson?.slug]);

  // Gamification hook for XP awards
  const { awardXP, syncXP } = useGamification();

  // Save progress to API
  const saveProgress = useCallback(
    async (
      lessonId: string,
      xpEarned: number,
      challengeResults?: { passed: number; total: number; code?: string }
    ) => {
      if (!session?.user?.id || !course) return;

      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete-lesson',
            userId: session.user.id,
            courseId: course.id,
            courseSlug: course.slug,
            lessonId,
            xpEarned,
            totalLessons: allLessons.length,
            challengeData: challengeResults
              ? {
                  codeSubmitted: challengeResults.code,
                  testsPassed: challengeResults.passed,
                  testsTotal: challengeResults.total,
                }
              : undefined,
          }),
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    },
    [session?.user?.id, course, allLessons.length]
  );

  // Handle challenge completion
  const handleChallengeComplete = useCallback(
    async (code: string) => {
      setChallengeCompleted(true);
      setIsCompleted(true);
      setIsCompleting(true);

      try {
        // Award XP for challenge completion
        const xpAmount = challengeData?.xpReward || lessonData?.lesson.xpReward || 50;
        await awardXP(xpAmount, 'challenge_completion');

        // Save progress with challenge data
        await saveProgress(lessonData?.lesson.slug || '', xpAmount, {
          passed: challengeData?.testCases.length || 0,
          total: challengeData?.testCases.length || 0,
          code,
        });

        // Sync with on-chain XP if available
        await syncXP();

        toast.success(`Challenge completed! +${xpAmount} XP awarded`);
      } catch (error) {
        console.error('Failed to award XP:', error);
        toast.success('Challenge completed!');
      } finally {
        setIsCompleting(false);
      }
    },
    [challengeData, lessonData, awardXP, syncXP, saveProgress]
  );

  // Find current lesson index
  const currentLessonIndex = allLessons.findIndex((l: any) => l.slug === params.id);
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const progressPercentage =
    allLessons.length > 0 ? Math.round((completedLessonsCount / allLessons.length) * 100) : 0;

  const handleMarkComplete = async () => {
    setIsCompleting(true);
    try {
      // Award XP for lesson completion
      const xpAmount = lessonData?.lesson.xpReward || 25;
      await awardXP(xpAmount, 'lesson_completion');

      // Save progress to API
      await saveProgress(lessonData?.lesson.slug || '', xpAmount);

      await syncXP();
      setIsCompleted(true);
      toast.success(`Lesson completed! +${xpAmount} XP`);
    } catch (error) {
      console.error('Failed to mark complete:', error);
      setIsCompleted(true);
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Loading lesson...</p>
      </div>
    );
  }

  // If no lesson found
  if (!lessonData) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="bg-background border-b px-4 py-3">
          <div className="container">
            <Link
              href={`/courses/${params.slug}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Link>
          </div>
        </div>
        <div className="container flex flex-1 items-center justify-center py-8">
          <Card className="max-w-md text-center">
            <CardContent className="py-8">
              <p className="text-muted-foreground">Lesson not found</p>
              <Button variant="outline" asChild className="mt-4">
                <Link href={`/courses/${params.slug}`}>Back to Course</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { lesson } = lessonData;

  // Challenge view with split layout
  const isChallenge = lesson.type === 'challenge' && challengeData;
  const isVideo = lesson.type === 'video' && lesson.videoUrl;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top navigation */}
      <div className="bg-background border-b px-4 py-3">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/courses/${params.slug}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm font-medium">{course?.title || 'Course'}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <Progress value={progressPercentage} className="w-32" />
              <span className="text-muted-foreground text-sm">{progressPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - lesson list */}
        <div className="hidden w-72 border-r lg:block">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="mb-4 font-semibold">Module Overview</h3>
              <div className="space-y-4">
                {moduleOverview.map((module: any) => (
                  <div key={module.id} className="space-y-1">
                    <p className="text-muted-foreground px-2 text-xs font-semibold tracking-wide uppercase">
                      {module.title}
                    </p>
                    {module.lessons.map((lessonItem: any) => (
                      <Link
                        key={lessonItem.id}
                        href={`/courses/${params.slug}/lessons/${lessonItem.slug}`}
                        className={`flex items-center gap-3 rounded-lg p-2 text-sm transition-colors ${
                          lessonItem.slug === params.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {lessonItem.slug === params.id && isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                        ) : lessonItem.type === 'challenge' ? (
                          <PlayCircle className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                        ) : (
                          <Circle className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="line-clamp-1">{lessonItem.title}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Content area - Split layout for challenges, regular for lessons */}
        {isChallenge ? (
          <SplitLayout
            className="flex-1"
            leftPanel={
              <div className="h-full overflow-auto">
                <div className="max-w-3xl p-6">
                  {/* Lesson header */}
                  <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="default" className="bg-purple-600">
                        Challenge
                      </Badge>
                      <span className="text-muted-foreground text-sm">{lesson.duration} min</span>
                      <span className="flex items-center gap-1 text-sm text-yellow-500">
                        <Zap className="h-4 w-4" />
                        {challengeData.xpReward} XP
                      </span>
                      {isCompleted && (
                        <Badge className="gap-1 bg-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold">{lesson.title}</h1>
                  </div>

                  {/* Lesson content without challenge block */}
                  <MDXContent content={displayContent} />

                  {/* Navigation at bottom of content */}
                  <div className="mt-8 flex items-center justify-between border-t pt-6">
                    {previousLesson ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/courses/${params.slug}/lessons/${previousLesson.slug}`}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Previous
                        </Link>
                      </Button>
                    ) : (
                      <div />
                    )}
                    {nextLesson && (
                      <Button size="sm" asChild disabled={!isCompleted}>
                        <Link href={`/courses/${params.slug}/lessons/${nextLesson.slug}`}>
                          Next Lesson
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            }
            rightPanel={
              <div className="h-full overflow-auto bg-zinc-950 p-4">
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center">
                      <LogoLoader size="md" message="Loading challenge..." />
                    </div>
                  }
                >
                  <CodeChallenge
                    title={challengeData.title || 'Coding Challenge'}
                    prompt={challengeData.prompt}
                    starterCode={challengeData.starterCode}
                    solution={challengeData.solution}
                    language={challengeData.language}
                    testCases={challengeData.testCases}
                    hints={
                      challengeData.hints.length > 0 ? challengeData.hints : lesson.hints || []
                    }
                    xpReward={challengeData.xpReward}
                    onComplete={handleChallengeComplete}
                  />
                </Suspense>
              </div>
            }
            initialRatio={0.45}
            minLeftWidth={350}
            minRightWidth={450}
            collapsible
            storageKey={`lesson-${lesson.slug}`}
          />
        ) : (
          /* Regular lesson view */
          <SplitLayout
            className="flex-1"
            leftPanel={
              <div ref={regularLessonContentRef} className="h-full overflow-auto">
                <LessonProgressTracker
                  lessonType={lesson.type}
                  videoDurationSeconds={lesson.videoDurationSeconds || 0}
                  isCompleted={isCompleted}
                  onCompletionReady={handleMarkComplete}
                  challengeCompleted={challengeCompleted}
                  contentRef={regularLessonContentRef}
                >
                  <div className="container max-w-4xl py-8">
                {/* Lesson header */}
                <div className="mb-8">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary">
                      {isVideo ? 'Video' : lesson.type === 'reading' ? 'Reading' : 'Lesson'}
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      {lesson.duration} min {isVideo ? 'watch' : 'read'}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-yellow-500">
                      <Zap className="h-4 w-4" />
                      {lesson.xpReward} XP
                    </span>
                    {isCompleted && (
                      <Badge className="gap-1 bg-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold">{lesson.title}</h1>
                </div>

                {/* Video content for video lessons */}
                {isVideo && (
                  <div className="mb-8">
                    <VideoPlayer
                      url={lesson.videoUrl}
                      provider={lesson.videoProvider}
                      title={lesson.title}
                      className="overflow-hidden rounded-xl shadow-lg"
                    />
                  </div>
                )}

                {/* Lesson content rendered with MDX components */}
                <MDXContent content={displayContent} />

                {/* Hints section for regular lessons */}
                {lesson.hints && lesson.hints.length > 0 && (
                  <Card className="mt-8">
                    <CardHeader className="cursor-pointer" onClick={() => setShowHints(!showHints)}>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Hints ({lesson.hints.length})
                      </CardTitle>
                    </CardHeader>
                    {showHints && (
                      <CardContent>
                        <ul className="space-y-2">
                          {lesson.hints.map((hint: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="bg-muted flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs">
                                {index + 1}
                              </span>
                              {hint}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* Bottom navigation */}
                <div className="mt-12 flex items-center justify-between border-t pt-8">
                  {previousLesson ? (
                    <Button variant="outline" asChild>
                      <Link href={`/courses/${params.slug}/lessons/${previousLesson.slug}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Link>
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-4">
                    {!isCompleted && (
                      <Button
                        variant="secondary"
                        onClick={handleMarkComplete}
                        disabled={isCompleting}
                      >
                        {isCompleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Completing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark as Complete
                          </>
                        )}
                      </Button>
                    )}

                    {nextLesson ? (
                      <Button asChild>
                        <Link href={`/courses/${params.slug}/lessons/${nextLesson.slug}`}>
                          Next Lesson
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild>
                        <Link href={`/courses/${params.slug}`}>
                          Finish Course
                          <CheckCircle2 className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                  </div>
                </LessonProgressTracker>
              </div>
            }
            rightPanel={
              <div className="h-full overflow-auto bg-zinc-950 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Code2 className="h-4 w-4" />
                    Practice Editor
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleRunLessonCode}
                      disabled={isLessonCodeRunning}
                      className="gap-1"
                    >
                      {isLessonCodeRunning ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          Run
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetLessonEditor}
                      className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      Reset
                    </Button>
                  </div>
                </div>

                {lessonCodeOutput && (
                  <div className="mb-3 rounded-md border border-zinc-800 bg-zinc-900 p-3 text-zinc-200">
                    <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                      <span className={lessonCodeOutput.success ? 'text-green-400' : 'text-red-400'}>
                        {lessonCodeOutput.success ? 'Execution successful' : 'Execution failed'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">
                          {lessonCodeOutput.executionTime.toFixed(0)}ms
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLessonCodeOutput(null)}
                          className="h-7 px-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {lessonCodeOutput.error && (
                      <pre className="mb-2 overflow-x-auto text-xs whitespace-pre-wrap text-red-300">
                        {lessonCodeOutput.error}
                      </pre>
                    )}

                    {lessonCodeOutput.logs.length > 0 && (
                      <pre className="mb-2 overflow-x-auto text-xs whitespace-pre-wrap text-zinc-300">
                        {lessonCodeOutput.logs.join('\n')}
                      </pre>
                    )}

                    {lessonCodeOutput.output !== undefined && (
                      <pre className="overflow-x-auto text-xs whitespace-pre-wrap text-zinc-100">
                        {typeof lessonCodeOutput.output === 'string'
                          ? lessonCodeOutput.output
                          : JSON.stringify(lessonCodeOutput.output, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center">
                      <LogoLoader size="md" message="Loading editor..." />
                    </div>
                  }
                >
                  <CodeEditor
                    value={lessonEditorCode}
                    onChange={(value) => setLessonEditorCode(value ?? '')}
                    language={regularLessonEditorLanguage}
                    height="calc(100vh - 13rem)"
                    minimap={false}
                    className="rounded-md border border-zinc-800"
                  />
                </Suspense>
              </div>
            }
            initialRatio={0.52}
            minLeftWidth={350}
            minRightWidth={420}
            collapsible
            storageKey={`lesson-regular-${lesson.slug}`}
          />
        )}
      </div>
    </div>
  );
}
