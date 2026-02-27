'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { getLesson } from '@/lib/data/courses';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { learningProgressService } from '@/lib/services';
import { track } from '@/lib/analytics';
import { LessonResizableSplit } from '@/components/LessonResizableSplit';
import { LessonMarkdown } from '@/components/LessonMarkdown';

/** Code challenge stub: objectives, test cases (pass/fail), hint/solution toggles. Replace with Monaco + run harness when connecting to backend. */
function CodeEditorStub() {
  const [code, setCode] = useState('// Your code here\nconsole.log("Hello, Solana!");');
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean }[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setOutput(null);
    setTestResults(null);
    // Stub: simulate run + test results
    setTimeout(() => {
      setOutput('Hello, Solana!');
      setTestResults([
        { name: 'Output matches expected', passed: true },
        { name: 'No runtime errors', passed: true },
        { name: 'Code style (stub)', passed: false },
      ]);
      setRunning(false);
    }, 600);
  };

  const allPassed = testResults?.length && testResults.every((t) => t.passed);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-surface p-4 shadow-card">
        <p className="text-caption font-semibold text-[rgb(var(--text))]">Objectives</p>
        <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">
          Print &quot;Hello, Solana!&quot; to the console. In production, objectives come from the lesson content.
        </p>
        <p className="text-caption mt-2 font-medium text-[rgb(var(--text-subtle))]">Expected output</p>
        <p className="mt-1 font-mono text-[13px] text-[rgb(var(--text-muted))]">Hello, Solana!</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-surface p-4 shadow-card">
        <p className="text-caption font-medium text-[rgb(var(--text))]">Code editor</p>
        <textarea
          className="mt-3 w-full rounded-lg border border-border/50 bg-[rgb(var(--bg))] p-3 font-mono text-caption text-[rgb(var(--text))] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          rows={10}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Your code here"
          spellCheck={false}
          aria-label="Code editor"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="rounded-lg bg-accent px-4 py-2 text-caption font-medium text-[rgb(3_7_18)] transition hover:bg-accent-hover disabled:opacity-60"
          >
            {running ? 'Running…' : 'Run'}
          </button>
        </div>
        {output !== null && (
          <pre className="mt-3 rounded-lg border border-border/50 bg-[rgb(var(--bg))] p-3 font-mono text-caption text-[rgb(var(--text-muted))] whitespace-pre-wrap">
            {output}
          </pre>
        )}
        {testResults && (
          <div className="mt-3 rounded-lg border border-border/50 bg-[rgb(var(--bg))] p-3">
            <p className="text-caption font-medium text-[rgb(var(--text))]">Test cases</p>
            <ul className="mt-2 space-y-1.5" aria-label="Test results">
              {testResults.map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-caption">
                  <span className={t.passed ? 'text-success' : 'text-red-400'} aria-hidden>
                    {t.passed ? '✓' : '✗'}
                  </span>
                  <span className={t.passed ? 'text-[rgb(var(--text-muted))]' : 'text-[rgb(var(--text))]'}>{t.name}</span>
                </li>
              ))}
            </ul>
            {allPassed && (
              <p className="mt-2 text-caption font-medium text-success" role="status">
                All tests passed! Mark the lesson complete to earn XP.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        <button
          type="button"
          onClick={() => setShowHint((h) => !h)}
          className="text-caption font-medium text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded focus-visible:outline-none"
        >
          {showHint ? 'Hide hint' : 'Show hint'}
        </button>
        {showHint && (
          <p className="mt-2 text-caption text-[rgb(var(--text-muted))]">
            Use <code className="rounded bg-surface-elevated px-1">console.log()</code> to print the required string. Stub hint; real hints come from CMS.
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowSolution((s) => !s)}
          className="ml-4 text-caption font-medium text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded focus-visible:outline-none"
        >
          {showSolution ? 'Hide solution' : 'Show solution'}
        </button>
        {showSolution && (
          <pre className="mt-2 rounded-lg border border-border/50 bg-[rgb(var(--bg))] p-3 font-mono text-[13px] text-[rgb(var(--text-muted))] whitespace-pre-wrap">
            console.log(&quot;Hello, Solana!&quot;);
          </pre>
        )}
      </div>
    </div>
  );
}

export default function LessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const { publicKey } = useWallet();
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const result = getLesson(slug, id);
  if (!result) {
    return (
      <>
        <Header />
        <main id="main-content" className="mx-auto max-w-5xl px-4 py-10" tabIndex={-1}>
          <p className="text-body text-[rgb(var(--text-muted))]">Lesson not found.</p>
          <Link href="/courses" className="text-body mt-4 block text-accent hover:underline">← Courses</Link>
        </main>
      </>
    );
  }

  const { course, lesson } = result;
  const lessonIndex = course.lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < course.lessons.length - 1 ? course.lessons[lessonIndex + 1] : null;
  const xpPerLesson = course.lessons.length > 0
    ? Math.max(1, Math.floor(course.xpReward / course.lessons.length))
    : 25;

  useEffect(() => {
    if (!publicKey) return;
    const wallet = publicKey.toBase58();
    fetch(`/api/progress?wallet=${encodeURIComponent(wallet)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = data.completedLessons?.[course.id] ?? [];
        setCompleted(list.includes(lesson.id));
      })
      .catch(() => {});
  }, [publicKey, course.id, lesson.id]);

  const markComplete = async () => {
    if (!publicKey) return;
    setCompleting(true);
    const wallet = publicKey.toBase58();
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet,
        courseId: course.id,
        lessonId: lesson.id,
      }),
    });
    await learningProgressService.completeLesson(wallet, course.id, lesson.id);
    setCompleted(true);
    setCompleting(false);
    setShowSuccess(true);
    track({ name: 'lesson_complete', courseId: course.id, lessonId: lesson.id, wallet });
    const t = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(t);
  };

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 sm:px-6" tabIndex={-1}>
        <Link
          href={`/courses/${course.slug}`}
          className="text-caption text-[rgb(var(--text-muted))] hover:text-accent"
        >
          ← {course.title}
        </Link>

        {/* Split layout: resizable when code type, single column otherwise */}
        {lesson.type === 'code' ? (
          <LessonResizableSplit
            left={
              <div className="rounded-xl border border-border/50 bg-surface p-6 shadow-card h-full min-h-[300px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-caption rounded bg-surface-elevated px-2 py-0.5 text-[rgb(var(--text-muted))]">
                    {lesson.type}
                  </span>
                  <span className="text-caption text-[rgb(var(--text-subtle))]">{lesson.duration}</span>
                </div>
                <h1 className="text-title mt-2 font-semibold text-[rgb(var(--text))]">
                  {lesson.title}
                </h1>
                <div className="prose prose-invert mt-4 max-w-none text-body text-[rgb(var(--text-muted))]">
                  {lesson.content ? (
                    <LessonMarkdown content={lesson.content} />
                  ) : (
                    <p>Challenge prompt and objectives would appear here. Use the code editor on the right.</p>
                  )}
                </div>
                {showSuccess && (
                  <p className="mt-4 text-body font-medium text-success" role="status">
                    Lesson completed! +{xpPerLesson} XP
                  </p>
                )}
                {publicKey && (
                  <button
                    type="button"
                    onClick={markComplete}
                    className="mt-6 rounded-lg bg-accent px-4 py-2 text-body font-medium text-[rgb(3_7_18)] transition hover:bg-accent-hover disabled:opacity-50"
                    disabled={completed || completing}
                    aria-busy={completing}
                  >
                    {completing ? 'Completing…' : completed ? 'Completed' : 'Mark complete'}
                  </button>
                )}
              </div>
            }
            right={<CodeEditorStub />}
          />
        ) : (
          <div className="mt-6">
            <div className="rounded-xl border border-border/50 bg-surface p-6 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption rounded bg-surface-elevated px-2 py-0.5 text-[rgb(var(--text-muted))]">
                  {lesson.type}
                </span>
                <span className="text-caption text-[rgb(var(--text-subtle))]">{lesson.duration}</span>
              </div>
              <h1 className="text-title mt-2 font-semibold text-[rgb(var(--text))]">
                {lesson.title}
              </h1>
              <div className="mt-4 max-w-none text-body text-[rgb(var(--text-muted))]">
                {lesson.type === 'video' && (
                  <p>Video content would render here. For MVP, complete the lesson to track progress.</p>
                )}
                {lesson.type === 'read' && (
                  lesson.content ? <LessonMarkdown content={lesson.content} className="mt-4" /> : (
                    <p>Markdown content with syntax highlighting would render here. For MVP, mark as complete when done reading.</p>
                  )
                )}
                {lesson.type === 'quiz' && (
                  <p>Quiz questions would appear here. For MVP, mark as complete when you finish the quiz.</p>
                )}
              </div>
              {showSuccess && (
                <p className="mt-4 text-body font-medium text-success" role="status">
                  Lesson completed! +{xpPerLesson} XP
                </p>
              )}
              {publicKey && (
                <button
                  type="button"
                  onClick={markComplete}
                  className="mt-6 rounded-lg bg-accent px-4 py-2 text-body font-medium text-[rgb(3_7_18)] transition hover:bg-accent-hover disabled:opacity-50"
                  disabled={completed || completing}
                  aria-busy={completing}
                >
                  {completing ? 'Completing…' : completed ? 'Completed' : 'Mark complete'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Prev/Next */}
        <nav className="mt-8 flex justify-between border-t border-border/50 pt-6" aria-label="Lesson navigation">
          {prevLesson ? (
            <Link
              href={`/courses/${course.slug}/lessons/${prevLesson.id}`}
              className="text-body font-medium text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none rounded"
              aria-label={`Previous lesson: ${prevLesson.title}`}
            >
              ← {prevLesson.title}
            </Link>
          ) : (
            <span />
          )}
          {nextLesson ? (
            <Link
              href={`/courses/${course.slug}/lessons/${nextLesson.id}`}
              className="text-body font-medium text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none rounded"
              aria-label={`Next lesson: ${nextLesson.title}`}
            >
              {nextLesson.title} →
            </Link>
          ) : (
            <Link
              href={`/courses/${course.slug}`}
              className="text-body font-medium text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none rounded"
              aria-label="Back to course overview"
            >
              Back to course →
            </Link>
          )}
        </nav>
      </main>
    </>
  );
}
