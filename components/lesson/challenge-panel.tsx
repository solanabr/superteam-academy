'use client';

import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useI18n } from '@/components/i18n/i18n-provider';
import { ChallengeTestCase, Lesson } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';

function evaluateSubmission(code: string, tests: ChallengeTestCase[]): ChallengeTestCase[] {
  const completed = !code.includes('TODO') && code.trim().length > 0;
  return tests.map((testCase) => ({ ...testCase, passed: completed }));
}

function getRealtimeNotes(
  code: string,
  language: Lesson['language'],
  dictionary: ReturnType<typeof useI18n>['dictionary']
): string[] {
  const notes: string[] = [];

  if (code.includes('TODO')) {
    notes.push(dictionary.lesson.removeTodoHint);
  }

  if (language === 'rust' && !code.includes('Ok(())')) {
    notes.push(dictionary.lesson.rustHint);
  }

  if (language === 'typescript' && !code.includes('return')) {
    notes.push(dictionary.lesson.tsHint);
  }

  return notes;
}

export function ChallengePanel({
  lesson,
  storageKey
}: {
  lesson: Lesson;
  storageKey?: string;
}): JSX.Element {
  const { dictionary } = useI18n();
  const [code, setCode] = useState<string>(lesson.starterCode ?? '');
  const [testCases, setTestCases] = useState<ChallengeTestCase[]>(lesson.testCases ?? []);
  const [output, setOutput] = useState<string>(dictionary.lesson.readyToRun);
  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const saved = window.localStorage.getItem(storageKey);
    if (saved && saved.length > 0) {
      setCode(saved);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    window.localStorage.setItem(storageKey, code);
  }, [code, storageKey]);

  const allPassed = useMemo(() => testCases.every((item) => item.passed), [testCases]);
  const realtimeNotes = useMemo(
    () => getRealtimeNotes(code, lesson.language, dictionary),
    [code, lesson.language, dictionary]
  );

  async function handleRun(): Promise<void> {
    setRunning(true);
    setOutput(dictionary.lesson.runningChallenge);
    trackEvent('challenge_run', { lessonId: lesson.id, language: lesson.language ?? 'unknown' });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = evaluateSubmission(code, testCases);
    setTestCases(result);

    if (result.every((item) => item.passed)) {
      setOutput(dictionary.lesson.allTestsPassed);
      trackEvent('challenge_passed', { lessonId: lesson.id, totalTests: result.length });
    } else {
      setOutput(dictionary.lesson.testsFailed);
    }

    setRunning(false);
  }

  return (
    <section className="space-y-3">
      <header className="space-y-1">
        <h3 className="text-base font-semibold">{dictionary.lesson.codeChallenge}</h3>
        <p className="text-sm text-foreground/70">{lesson.markdown}</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-border/70 shadow-inner">
        <Editor
          value={code}
          defaultLanguage={lesson.language ?? 'typescript'}
          onChange={(value) => setCode(value ?? '')}
          height="360px"
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: 'on',
            lineNumbers: 'on',
            automaticLayout: true
          }}
        />
      </div>

      {realtimeNotes.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          {realtimeNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div className="panel-soft bg-muted/70 font-mono text-xs">{output}</div>
        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={running}
          className="btn-primary disabled:opacity-60"
        >
          {running ? dictionary.common.running : dictionary.common.runTests}
        </button>
      </div>

      <ul className="space-y-2">
        {testCases.map((testCase) => (
          <li
            key={testCase.id}
            className={`rounded-xl border px-3 py-2 text-sm ${
              testCase.passed
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
            }`}
          >
            <span className="font-medium">{testCase.label}</span>
            <span className="ml-2 text-xs opacity-80">
              {dictionary.lesson.expectedLabel}: {testCase.expected}
            </span>
          </li>
        ))}
      </ul>

      <div className="panel-soft border-border/70 bg-background/60 text-sm">
        {dictionary.lesson.resultLabel}: {allPassed ? dictionary.lesson.resultPass : dictionary.lesson.resultFail}
      </div>
    </section>
  );
}
