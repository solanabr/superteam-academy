'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { ModuleAccordion } from '@/components/courses/module-accordion';
import type { ModuleData } from '@/components/courses/module-accordion';
import type { LessonData } from '@/components/courses/lesson-row';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CurriculumListProps {
  courseId: string;
  lessonCount: number;
  enrollment?: {
    completedLessons: number;
  };
}

// ---------------------------------------------------------------------------
// Mock module data (will come from Sanity later)
// ---------------------------------------------------------------------------

function generateMockModules(lessonCount: number): ModuleData[] {
  if (lessonCount === 0) return [];

  const lessonTypes: LessonData['type'][] = ['theory', 'code', 'quiz'];

  // Distribute lessons across 3-5 modules for realistic structure
  const moduleCount = Math.min(5, Math.max(2, Math.ceil(lessonCount / 4)));
  const baseLessonsPerModule = Math.floor(lessonCount / moduleCount);
  const remainder = lessonCount % moduleCount;

  const moduleNames = [
    'Getting Started',
    'Core Concepts',
    'Building Blocks',
    'Advanced Patterns',
    'Capstone Project',
  ];

  const lessonPrefixes: Record<number, string[]> = {
    0: ['Introduction to', 'Setting Up', 'Your First', 'Understanding'],
    1: ['Deep Dive into', 'Working with', 'Exploring', 'Mastering'],
    2: ['Implementing', 'Creating', 'Building', 'Composing'],
    3: ['Optimizing', 'Securing', 'Testing', 'Debugging'],
    4: ['Project:', 'Challenge:', 'Integration:', 'Final:'],
  };

  const topics = [
    'Accounts', 'Programs', 'Transactions', 'PDAs',
    'Token Standards', 'CPIs', 'State Management', 'Error Handling',
    'Serialization', 'Testing', 'Security', 'Deployment',
    'Client Integration', 'Event Listeners', 'Versioning', 'Upgrades',
    'Governance', 'Staking', 'Oracles', 'Compression',
  ];

  let globalLessonIdx = 0;

  return Array.from({ length: moduleCount }, (_, moduleIdx) => {
    const lessonsInModule =
      baseLessonsPerModule + (moduleIdx < remainder ? 1 : 0);

    const prefixes = lessonPrefixes[moduleIdx] ?? lessonPrefixes[0]!;

    const lessons: LessonData[] = Array.from(
      { length: lessonsInModule },
      (_, lessonIdx) => {
        const prefix = prefixes[lessonIdx % prefixes.length]!;
        const topic = topics[globalLessonIdx % topics.length]!;
        globalLessonIdx++;

        return {
          title: `${prefix} ${topic}`,
          type: lessonTypes[lessonIdx % lessonTypes.length]!,
          xp: 25,
        };
      },
    );

    return {
      title: moduleNames[moduleIdx] ?? `Module ${moduleIdx + 1}`,
      lessons,
    };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CurriculumList({
  courseId,
  lessonCount,
  enrollment,
}: CurriculumListProps) {
  const t = useTranslations('courses');

  const modules = useMemo(
    () => generateMockModules(lessonCount),
    [lessonCount],
  );

  // Build a set of completed lesson indices.
  // Since we don't have per-lesson completion data from the bitmap yet,
  // treat the first N lessons as completed based on completedLessons count.
  const completedLessons = useMemo(() => {
    const completed = new Set<number>();
    const count = enrollment?.completedLessons ?? 0;
    for (let i = 0; i < count; i++) {
      completed.add(i);
    }
    return completed;
  }, [enrollment?.completedLessons]);

  const totalLessons = modules.reduce(
    (sum, mod) => sum + mod.lessons.length,
    0,
  );

  // Determine which modules to expand by default (first incomplete module)
  const defaultExpanded = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i]!;
      const completedInModule = mod.lessons.filter((_, j) =>
        completedLessons.has(offset + j),
      ).length;

      if (completedInModule < mod.lessons.length) {
        return [`module-${i}`];
      }
      offset += mod.lessons.length;
    }
    // All complete — expand the last module
    return [`module-${modules.length - 1}`];
  }, [modules, completedLessons]);

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <BookOpen className="text-muted-foreground size-8" />
        <p className="text-muted-foreground text-sm">
          {t('no_curriculum')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{t('curriculum')}</h3>
        <span className="text-muted-foreground text-sm">
          {modules.length} {t('modules')} &middot; {totalLessons} {t('lessons')}
        </span>
      </div>

      {/* Modules */}
      <Accordion type="multiple" defaultValue={defaultExpanded}>
        {modules.map((mod, moduleIdx) => {
          const offset = modules
            .slice(0, moduleIdx)
            .reduce((sum, m) => sum + m.lessons.length, 0);

          return (
            <ModuleAccordion
              key={moduleIdx}
              module={mod}
              moduleIndex={moduleIdx}
              courseId={courseId}
              lessonOffset={offset}
              completedLessons={completedLessons}
            />
          );
        })}
      </Accordion>
    </div>
  );
}
