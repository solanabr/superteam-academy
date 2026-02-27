'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { CourseCardIcon } from '@/components/CourseCardIcon';
import {
  courses,
  DIFFICULTY_LABELS,
  TOPIC_LABELS,
  type Course,
  type Difficulty,
  type Topic,
} from '@/lib/data/courses';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

const DURATIONS = ['1h', '2h', '4h'] as const;

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [duration, setDuration] = useState<string>('all');
  const { publicKey } = useWallet();
  const [progressByCourse, setProgressByCourse] = useState<Record<string, number>>({});
  const [progressLoading, setProgressLoading] = useState(!!publicKey);

  useEffect(() => {
    if (!publicKey) {
      setProgressByCourse({});
      setProgressLoading(false);
      return;
    }
    setProgressLoading(true);
    fetch(`/api/progress?wallet=${encodeURIComponent(publicKey.toBase58())}`)
      .then((r) => r.json())
      .then((data) => {
        const completed = data.completedLessons ?? {};
        const out: Record<string, number> = {};
        courses.forEach((c) => {
          const done = (completed[c.id] ?? []).length;
          out[c.id] = c.lessons.length ? Math.round((done / c.lessons.length) * 100) : 0;
        });
        setProgressByCourse(out);
      })
      .catch(() => setProgressByCourse({}))
      .finally(() => setProgressLoading(false));
  }, [publicKey]);

  const filtered = useMemo(() => {
    let list = [...courses];
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          TOPIC_LABELS[c.topic].toLowerCase().includes(q) ||
          DIFFICULTY_LABELS[c.difficulty].toLowerCase().includes(q)
      );
    }
    if (difficulty !== 'all') list = list.filter((c) => c.difficulty === difficulty);
    if (topic !== 'all') list = list.filter((c) => c.topic === topic);
    if (duration !== 'all') list = list.filter((c) => c.duration === duration);
    return list;
  }, [search, difficulty, topic, duration]);

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-10 sm:px-6" tabIndex={-1}>
        <div className="mb-8">
          <h1 className="text-title font-semibold text-[rgb(var(--text))]">
            Course catalog
          </h1>
          <p className="text-body mt-1 text-[rgb(var(--text-muted))]">
            Filter by difficulty, topic, and duration. Full-text search below.
          </p>
        </div>

        {/* Filters + search */}
        <div className="mb-8 flex flex-col gap-4 rounded-xl border border-border/50 bg-surface p-4" role="search" aria-label="Filter courses">
          <label htmlFor="course-search" className="sr-only">Search courses by title, description, topic, or difficulty</label>
          <input
            id="course-search"
            type="search"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            aria-describedby="filter-description"
            className="w-full rounded-lg border border-border/50 bg-[rgb(var(--bg))] px-4 py-2.5 text-body text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-subtle))] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p id="filter-description" className="sr-only">Results update as you type and when you change filters below.</p>
          <div className="flex flex-wrap gap-3" aria-label="Filter by difficulty, topic, and duration">
            <label htmlFor="filter-difficulty" className="sr-only">Difficulty</label>
            <select
              id="filter-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty((e.target.value || 'all') as Difficulty | 'all')}
              aria-label="Filter by difficulty"
              className="rounded-lg border border-border/50 bg-[rgb(var(--bg))] px-3 py-2 text-caption text-[rgb(var(--text))] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All difficulties</option>
              {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </select>
            <label htmlFor="filter-topic" className="sr-only">Topic</label>
            <select
              id="filter-topic"
              value={topic}
              onChange={(e) => setTopic((e.target.value || 'all') as Topic | 'all')}
              aria-label="Filter by topic"
              className="rounded-lg border border-border/50 bg-[rgb(var(--bg))] px-3 py-2 text-caption text-[rgb(var(--text))] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All topics</option>
              {(Object.keys(TOPIC_LABELS) as Topic[]).map((t) => (
                <option key={t} value={t}>{TOPIC_LABELS[t]}</option>
              ))}
            </select>
            <label htmlFor="filter-duration" className="sr-only">Duration</label>
            <select
              id="filter-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              aria-label="Filter by duration"
              className="rounded-lg border border-border/50 bg-[rgb(var(--bg))] px-3 py-2 text-caption text-[rgb(var(--text))] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">Any duration</option>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Learning paths */}
        <section className="mb-10">
          <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">
            Learning paths
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/courses/solana-fundamentals"
              className="rounded-lg border border-border/50 bg-surface px-4 py-3 text-body font-medium text-[rgb(var(--text))] transition hover:border-accent/40"
            >
              Solana Fundamentals
            </Link>
            <Link
              href="/courses/building-on-solana"
              className="rounded-lg border border-border/50 bg-surface px-4 py-3 text-body font-medium text-[rgb(var(--text))] transition hover:border-accent/40"
            >
              DeFi Developer path
            </Link>
          </div>
        </section>

        {/* Course grid */}
        <section>
          <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">
            All courses ({filtered.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={progressLoading}>
            {filtered.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                iconIndex={courses.findIndex((c) => c.id === course.id) % 3}
                progressPercent={progressByCourse[course.id] ?? 0}
                progressLoading={progressLoading}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-xl border border-border/50 border-dashed bg-surface/50 p-8 text-center">
              <p className="text-body text-[rgb(var(--text-muted))]">
                No courses match your filters.
              </p>
              <button
                type="button"
                onClick={() => { setSearch(''); setDifficulty('all'); setTopic('all'); setDuration('all'); }}
                className="text-body mt-4 inline-flex font-medium text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none rounded"
              >
                Clear filters and search
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

const CARD_GRADIENTS = [
  'from-cyan-500/20 via-cyan-400/10 to-transparent',
  'from-violet-500/20 via-violet-400/10 to-transparent',
  'from-amber-500/20 via-amber-400/10 to-transparent',
];
const CARD_ICON_COLORS = ['text-cyan-400', 'text-violet-400', 'text-amber-400'];

function CourseCard({ course, iconIndex, progressPercent, progressLoading }: { course: Course; iconIndex: number; progressPercent: number; progressLoading?: boolean }) {
  const i = iconIndex % 3;
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col rounded-xl border border-border/50 bg-surface shadow-card transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none"
    >
      <div className={`h-32 rounded-t-xl bg-gradient-to-br ${CARD_GRADIENTS[i]} flex items-center justify-center ${CARD_ICON_COLORS[i]}`} aria-hidden>
        <CourseCardIcon index={iconIndex} className="h-14 w-14 opacity-80" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="text-caption rounded bg-accent/20 px-2 py-0.5 font-medium text-accent">
            {DIFFICULTY_LABELS[course.difficulty]}
          </span>
          <span className="text-caption text-[rgb(var(--text-subtle))]">
            {course.duration}
          </span>
          {progressLoading && (
            <span className="text-caption text-[rgb(var(--text-subtle))]" aria-hidden>…</span>
          )}
          {!progressLoading && progressPercent > 0 && (
            <span className="text-caption font-medium text-success">
              {progressPercent}% done
            </span>
          )}
        </div>
        <h2 className="text-title font-semibold text-[rgb(var(--text))] group-hover:text-accent">
          {course.title}
        </h2>
        <p className="text-caption mt-1.5 line-clamp-2 flex-1 text-[rgb(var(--text-muted))]">
          {course.description}
        </p>
        <div className="text-caption mt-4 flex gap-4 text-[rgb(var(--text-subtle))]">
          <span>{course.instructor}</span>
          <span>{course.lessons.length} lessons</span>
          <span>{course.xpReward} XP</span>
        </div>
      </div>
    </Link>
  );
}
