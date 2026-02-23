import { useState } from 'react';
import { COURSES } from '@/lib/mockData';
import { CourseCard } from '@/components/CourseCard';
import { useCourse } from '@/hooks/useCourse';
import { Search, Filter, Zap } from 'lucide-react';

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const CATEGORIES = ['All', 'Fundamentals', 'Smart Contracts', 'DeFi', 'NFTs'];

export default function Courses() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [category, setCategory] = useState('All');
  const { getCourseProgressPercent, isEnrolled } = useCourse();

  const filtered = COURSES.filter(course => {
    const matchSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase()) ||
      course.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchDiff = difficulty === 'All' || course.difficulty === difficulty;
    const matchCat = category === 'All' || course.category === category;
    return matchSearch && matchDiff && matchCat;
  });

  const totalXP = COURSES.reduce((sum, c) => sum + c.totalXP, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Courses</h1>
          <p className="text-muted-foreground">
            {COURSES.length} courses · Up to{' '}
            <span className="inline-flex items-center gap-1 xp-badge px-2 py-0.5 rounded-full text-sm font-semibold">
              <Zap className="h-3 w-3" /> {totalXP.toLocaleString()} XP
            </span>{' '}
            to earn
          </p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses, topics, technologies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-card border border-card-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-card border border-card-border rounded-xl px-3 py-2.5">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="bg-transparent text-sm text-foreground focus:outline-none cursor-pointer"
              >
                {DIFFICULTIES.map(d => <option key={d} value={d} className="bg-card">{d}</option>)}
              </select>
            </div>

            <div className="flex items-center bg-card border border-card-border rounded-xl px-3 py-2.5">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="bg-transparent text-sm text-foreground focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {DIFFICULTIES.slice(1).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(difficulty === d ? 'All' : d)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                difficulty === d
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-card-border text-muted-foreground hover:border-muted'
              }`}
            >
              {d}
            </button>
          ))}
          {CATEGORIES.slice(1).map(c => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? 'All' : c)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                category === c
                  ? 'bg-secondary/15 border-secondary/40 text-secondary'
                  : 'border-card-border text-muted-foreground hover:border-muted'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No courses match your search.</p>
            <button
              onClick={() => { setSearch(''); setDifficulty('All'); setCategory('All'); }}
              className="mt-4 text-primary hover:underline text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              Showing {filtered.length} of {COURSES.length} courses
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  progress={getCourseProgressPercent(course.id)}
                  enrolled={isEnrolled(course.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
