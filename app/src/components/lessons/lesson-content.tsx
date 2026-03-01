'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Lightbulb,
  AlertTriangle,
  Info,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { seedLessons, seedLessonContents } from '@/lib/sanity/seed-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonContentProps {
  courseId: string;
  lessonIndex: number;
  className?: string;
}

interface AdmonitionProps {
  type: 'tip' | 'warning' | 'info';
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Mock lesson data (to be replaced by CMS/API fetch)
// ---------------------------------------------------------------------------

interface MockLesson {
  title: string;
  sections: {
    type: 'text' | 'code' | 'admonition' | 'key-concepts';
    content?: string;
    language?: string;
    admonitionType?: 'tip' | 'warning' | 'info';
    concepts?: string[];
  }[];
}

// The section type matches what seed-data.ts exports as SeedContentSection
function getMockLesson(_courseId: string, lessonIndex: number): MockLesson {
  // Try seed data first
  const seedLesson = seedLessons.find((l) => l.lessonIndex === lessonIndex);
  const seedContent = seedLessonContents.find((c) => c.lessonIndex === lessonIndex);

  if (seedLesson && seedContent) {
    return {
      title: seedLesson.title.en ?? `Lesson ${lessonIndex + 1}`,
      sections: seedContent.en,
    };
  }

  // Fallback for lessons beyond seed data
  return {
    title: `Lesson ${lessonIndex + 1}`,
    sections: [
      {
        type: 'text',
        content: 'This lesson content is coming soon. Check back later!',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Admonition subcomponent
// ---------------------------------------------------------------------------

const ADMONITION_CONFIG = {
  tip: {
    icon: Lightbulb,
    label: 'tip',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-700 dark:text-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    label: 'warning',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5 dark:bg-amber-500/10',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    icon: Info,
    label: 'info',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5 dark:bg-blue-500/10',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-700 dark:text-blue-400',
  },
} as const;

function Admonition({ type, children }: AdmonitionProps) {
  const t = useTranslations('lesson');
  const config = ADMONITION_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border-l-4 p-4',
        config.border,
        config.bg,
      )}
      role="note"
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', config.iconColor)} />
      <div className="flex-1 space-y-1">
        <p className={cn('text-sm font-semibold', config.titleColor)}>
          {t(config.label)}
        </p>
        <div className="text-sm leading-relaxed text-foreground/80">
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code block subcomponent
// ---------------------------------------------------------------------------

function CodeBlock({ code, language }: { code: string; language: string }) {
  const lines = code.split('\n');

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <span className="text-xs font-medium text-muted-foreground">
          {language}
        </span>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto bg-[#1e1e1e] p-4">
        <pre className="font-mono text-sm leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 inline-block w-8 select-none text-right text-neutral-600">
                {i + 1}
              </span>
              <code className="text-[#d4d4d4]">{line || '\u00A0'}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Key concepts subcomponent
// ---------------------------------------------------------------------------

function KeyConcepts({ concepts }: { concepts: string[] }) {
  const t = useTranslations('lesson');

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 dark:bg-primary/10">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h3 className="text-sm font-semibold text-primary">
          {t('key_concepts')}
        </h3>
      </div>
      <ul className="space-y-2">
        {concepts.map((concept, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span className="text-foreground/80">{concept}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LessonContent({
  courseId,
  lessonIndex,
  className,
}: LessonContentProps) {
  const lesson = useMemo(
    () => getMockLesson(courseId, lessonIndex),
    [courseId, lessonIndex],
  );

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Lesson title */}
      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
        {lesson.title}
      </h1>

      {/* Render sections */}
      {lesson.sections.map((section, idx) => {
        switch (section.type) {
          case 'text':
            return (
              <p key={idx} className="text-sm leading-relaxed text-foreground/80 lg:text-base">
                {section.content}
              </p>
            );

          case 'code':
            return (
              <CodeBlock
                key={idx}
                code={section.content ?? ''}
                language={section.language ?? 'text'}
              />
            );

          case 'admonition':
            return (
              <Admonition key={idx} type={section.admonitionType ?? 'info'}>
                {section.content}
              </Admonition>
            );

          case 'key-concepts':
            return (
              <KeyConcepts key={idx} concepts={section.concepts ?? []} />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
