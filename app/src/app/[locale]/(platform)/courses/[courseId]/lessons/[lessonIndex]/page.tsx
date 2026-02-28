'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { LessonSidebar } from '@/components/lessons/lesson-sidebar';
import { LessonContent } from '@/components/lessons/lesson-content';
import { LessonCompleteButton } from '@/components/lessons/lesson-complete-button';
import { SolutionToggle } from '@/components/challenges/solution-toggle';
import type { TestResult } from '@/components/editor/output-panel';

const MonacoEditorWrapper = dynamic(
  () => import('@/components/editor/monaco-editor-wrapper').then((m) => m.MonacoEditorWrapper),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />,
  },
);

const OutputPanel = dynamic(
  () => import('@/components/editor/output-panel').then((m) => m.OutputPanel),
  {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full" />,
  },
);
import { useEnrollment } from '@/lib/hooks/use-enrollment';
import { useCourseStore } from '@/lib/stores/course-store';

// ---------------------------------------------------------------------------
// Mock code for interactive lessons
// ---------------------------------------------------------------------------

const MOCK_STARTER_CODE = `use solana_program::{
  account_info::AccountInfo,
  entrypoint,
  entrypoint::ProgramResult,
  pubkey::Pubkey,
  msg,
};

entrypoint!(process_instruction);

fn process_instruction(
  _program_id: &Pubkey,
  _accounts: &[AccountInfo],
  _instruction_data: &[u8],
) -> ProgramResult {
  // TODO: Add your logic here
  msg!("Hello, Solana!");
  Ok(())
}`;

const MOCK_SOLUTION_CODE = `use solana_program::{
  account_info::AccountInfo,
  entrypoint,
  entrypoint::ProgramResult,
  pubkey::Pubkey,
  msg,
};

entrypoint!(process_instruction);

fn process_instruction(
  _program_id: &Pubkey,
  _accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  if instruction_data.is_empty() {
    msg!("No instruction data provided, using defaults");
  }
  msg!("Hello, Solana!");
  Ok(())
}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isInteractiveLesson(lessonIndex: number): boolean {
  // Even-indexed lessons are interactive (have code editor)
  // Odd-indexed are theory-only. Replace with real CMS data.
  return lessonIndex % 2 === 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LessonPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonIndex = parseInt(params.lessonIndex as string, 10);

  const t = useTranslations('lesson');
  const tn = useTranslations('nav');

  const { enrollment, isLoading: enrollmentLoading } = useEnrollment(courseId);
  const selectedCourse = useCourseStore((s) => s.selectedCourse);

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [_code, setCode] = useState(MOCK_STARTER_CODE);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Track desktop breakpoint (lg: 1024px) for resizable vs stacked layout
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Derived state
  const courseTitle = selectedCourse?.title ?? 'Course';
  const lessonCount = selectedCourse?.lessonCount ?? 10;
  const completedLessons = enrollment?.completedLessons ?? 0;
  const isCompleted = lessonIndex < completedLessons;
  const isLastLesson = lessonIndex === lessonCount - 1;
  const isInteractive = isInteractiveLesson(lessonIndex);

  // Validate lesson index
  const isValidIndex = !isNaN(lessonIndex) && lessonIndex >= 0 && lessonIndex < lessonCount;

  // Simulate running code
  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setOutput('');
    setTestResults([]);

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setOutput(
      `Compiling program...\nBuild successful.\n\nRunning program...\n> Hello, Solana!\n\nProgram executed successfully. (0.42s)`,
    );

    setTestResults([
      { name: 'Program compiles without errors', passed: true, executionTime: 120 },
      { name: 'Entrypoint is correctly defined', passed: true, executionTime: 5 },
      { name: 'Message is logged correctly', passed: true, executionTime: 8 },
      {
        name: 'Handles empty instruction data',
        passed: false,
        message: 'Expected program to handle empty instruction_data gracefully',
        expected: 'Ok(())',
        actual: 'ProgramError::InvalidInstructionData',
        executionTime: 15,
      },
    ]);

    setIsRunning(false);
  }, []);

  // Reset code to default
  const handleResetCode = useCallback(() => {
    setCode(MOCK_STARTER_CODE);
    setOutput('');
    setTestResults([]);
  }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (enrollmentLoading) {
    return (
      <div className="flex h-full gap-0">
        <Skeleton className="hidden w-72 lg:block" />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-10 w-full max-w-lg" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Invalid lesson index
  // ---------------------------------------------------------------------------

  if (!isValidIndex) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Lesson not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This lesson does not exist in this course.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/courses/${courseId}`}>
              {t('back_to_course')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col lg:-m-8">
      {/* Top bar: breadcrumb + progress */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setSidebarVisible((p) => !p)}
            className="hidden lg:flex"
            aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarVisible ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </Button>

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/courses">{tn('courses')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/courses/${courseId}`}>
                    {courseTitle}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {t('lesson_of', { current: lessonIndex + 1, total: lessonCount })}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Progress indicator */}
        <Badge variant="secondary" className="gap-1 tabular-nums">
          {completedLessons}/{lessonCount}
        </Badge>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        {sidebarVisible && (
          <LessonSidebar
            courseId={courseId}
            courseTitle={courseTitle}
            lessonCount={lessonCount}
            currentIndex={lessonIndex}
            completedLessons={completedLessons}
            className="hidden lg:flex"
          />
        )}

        {/* Content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {isInteractive ? (
            isDesktop ? (
              // Desktop: resizable split pane
              <ResizablePanelGroup
                orientation="horizontal"
                className="flex-1"
              >
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full overflow-y-auto p-6">
                    <LessonContent
                      courseId={courseId}
                      lessonIndex={lessonIndex}
                    />
                    <SolutionToggle
                      solutionCode={MOCK_SOLUTION_CODE}
                      language="rust"
                      className="mt-6"
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="flex h-full flex-col overflow-hidden">
                    <MonacoEditorWrapper
                      defaultValue={MOCK_STARTER_CODE}
                      language="rust"
                      onChange={setCode}
                      onRun={handleRunCode}
                      onReset={handleResetCode}
                      isRunning={isRunning}
                      className="flex-1"
                    />
                    <OutputPanel
                      output={output}
                      testResults={testResults}
                      isRunning={isRunning}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              // Mobile: stacked layout
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto border-b p-6">
                  <LessonContent
                    courseId={courseId}
                    lessonIndex={lessonIndex}
                  />
                  <SolutionToggle
                    solutionCode={MOCK_SOLUTION_CODE}
                    language="rust"
                    className="mt-6"
                  />
                </div>

                <div className="flex flex-1 flex-col overflow-hidden">
                  <MonacoEditorWrapper
                    defaultValue={MOCK_STARTER_CODE}
                    language="rust"
                    onChange={setCode}
                    onRun={handleRunCode}
                    onReset={handleResetCode}
                    isRunning={isRunning}
                    className="flex-1"
                  />
                  <OutputPanel
                    output={output}
                    testResults={testResults}
                    isRunning={isRunning}
                  />
                </div>
              </div>
            )
          ) : (
            // Full-width theory lesson
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl p-6 lg:p-10">
                <LessonContent
                  courseId={courseId}
                  lessonIndex={lessonIndex}
                />
              </div>
            </div>
          )}

          {/* Bottom navigation bar */}
          <div className="flex items-center justify-between border-t bg-card px-4 py-3 lg:px-6">
            {/* Previous lesson */}
            <div>
              {lessonIndex > 0 ? (
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href={`/courses/${courseId}/lessons/${lessonIndex - 1}`}>
                    <ChevronLeft className="size-4" />
                    <span className="hidden sm:inline">{t('previous_lesson')}</span>
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href={`/courses/${courseId}`}>
                    <ChevronLeft className="size-4" />
                    <span className="hidden sm:inline">{t('back_to_course')}</span>
                  </Link>
                </Button>
              )}
            </div>

            {/* Complete + Next */}
            <div className="flex items-center gap-3">
              <LessonCompleteButton
                courseId={courseId}
                lessonIndex={lessonIndex}
                isCompleted={isCompleted}
                isLastLesson={isLastLesson}
              />

              {!isLastLesson && isCompleted && (
                <Button asChild size="sm" className="gap-1.5">
                  <Link href={`/courses/${courseId}/lessons/${lessonIndex + 1}`}>
                    <span className="hidden sm:inline">{t('next_lesson')}</span>
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
