'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/i18n/i18n-provider';
import { CourseSummary, Difficulty } from '@/lib/types';
import { CourseCard } from '@/components/courses/course-card';
import {
  getRegistrationRecord,
  REGISTRATION_CHANGED_EVENT
} from '@/lib/auth/registration-storage';
import { learningProgressService } from '@/lib/services';

interface CatalogFilters {
  query: string;
  difficulty: Difficulty | 'all';
  topic: string | 'all';
}

export function CourseCatalog({ courses }: { courses: CourseSummary[] }): JSX.Element {
  const { dictionary } = useI18n();
  const [filters, setFilters] = useState<CatalogFilters>({
    query: '',
    difficulty: 'all',
    topic: 'all'
  });
  const [registration, setRegistration] = useState<ReturnType<typeof getRegistrationRecord>>(null);
  const [progressByCourse, setProgressByCourse] = useState<Record<string, number>>({});

  useEffect(() => {
    function syncRegistration(): void {
      setRegistration(getRegistrationRecord());
    }

    syncRegistration();
    window.addEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);

    return () => {
      window.removeEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);
    };
  }, []);

  useEffect(() => {
    const userId = registration?.id ?? null;
    if (!userId) {
      setProgressByCourse({});
      return;
    }

    let active = true;

    async function loadProgress(): Promise<void> {
      const entries = await Promise.all(
        courses.map(async (course) => {
          const progress = await learningProgressService.getProgress(userId!, course.id);
          return [course.id, progress.percentage] as const;
        })
      );

      if (!active) {
        return;
      }

      setProgressByCourse(Object.fromEntries(entries));
    }

    void loadProgress();

    return () => {
      active = false;
    };
  }, [courses, registration?.id]);

  const topics = useMemo(() => {
    return ['all', ...new Set(courses.map((course) => course.topic))];
  }, [courses]);

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const byDifficulty = filters.difficulty === 'all' || course.difficulty === filters.difficulty;
      const byTopic = filters.topic === 'all' || course.topic === filters.topic;
      const haystack = `${course.title} ${course.description} ${course.path}`.toLowerCase();
      const byQuery = haystack.includes(filters.query.toLowerCase());
      return byDifficulty && byTopic && byQuery;
    });
  }, [courses, filters]);

  return (
    <section className="space-y-6">
      <div className="panel grid gap-3 p-4 md:grid-cols-4">
        <input
          value={filters.query}
          onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
          placeholder={dictionary.courses.searchPlaceholder}
          className="input-field"
        />

        <select
          value={filters.difficulty}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, difficulty: event.target.value as CatalogFilters['difficulty'] }))
          }
          className="input-field"
        >
          <option value="all">{dictionary.courses.allDifficulties}</option>
          <option value="beginner">{dictionary.courses.difficultyBeginner}</option>
          <option value="intermediate">{dictionary.courses.difficultyIntermediate}</option>
          <option value="advanced">{dictionary.courses.difficultyAdvanced}</option>
        </select>

        <select
          value={filters.topic}
          onChange={(event) => setFilters((prev) => ({ ...prev, topic: event.target.value }))}
          className="input-field"
        >
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>

        <div className="panel-soft flex items-center text-sm text-foreground/75">
          {`${filtered.length} ${dictionary.courses.foundSuffix}`}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            progressPercentage={registration ? progressByCourse[course.id] ?? 0 : 0}
          />
        ))}
      </div>
    </section>
  );
}
