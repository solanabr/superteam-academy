'use client'

import CourseCard from '@/components/CourseCard'
import { PathCard } from '@/components/PathCard'
import { StandardLayout } from '@/components/layout/StandardLayout'
import CourseCardSkeleton from '@/components/skeletons/CourseCardSkeleton'
import { coursesAPI } from '@/libs/api'
import { PATHS } from '@/libs/constants/home.constants'

import { Link } from '@/i18n/navigation'
import { toCourseCard, UICourse } from '@/libs/types/course.types'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']
const topics = [
  'All',
  'Core',
  'Smart Contracts',
  'DeFi',
  'Frontend',
  'Security',
  'NFTs',
]

const Courses = () => {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const [topic, setTopic] = useState('All')
  const tHome = useTranslations('home')
  const tCourses = useTranslations('courses')
  const cards = tHome.raw('paths.cards') as Array<{
    tag: string
    title: string
    desc: string
    modules: string[]
  }>

  // ── Fetch real courses from DB ──────────────────────────────
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses', 'published'],
    queryFn: () => coursesAPI.findPublished(),
    staleTime: 1000 * 60 * 5, // 5 min cache
  })

  useEffect(() => {
    console.log('coursesData', coursesData)
  }, [coursesData])

  const allCourses = useMemo(() => {
    if (!coursesData?.docs?.length) {
      return []
    }
    return coursesData.docs.map(toCourseCard)
  }, [coursesData])

  const filtered = useMemo(
    () =>
      allCourses.filter(
        (c) =>
          (difficulty === 'All' || c.difficulty === difficulty) &&
          (topic === 'All' || c.topic === topic) &&
          (search === '' ||
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.description.toLowerCase().includes(search.toLowerCase())),
      ),
    [allCourses, search, difficulty, topic],
  )

  return (
    <StandardLayout>
      {/* Hero */}
      <section>
        <div
          className='py-16 px-7 lg:px-0 pattern-diagonal'
          style={{ background: 'hsl(var(--green-secondary))' }}
        >
          <div className='max-w-[1200px] mx-auto'>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Hero badge: small label above main title */}
              <p
                className='font-ui text-[0.6875rem] font-bold tracking-widest uppercase mb-3'
                style={{ color: 'hsla(40,82%,88%,0.3)' }}
              >
                {tCourses('hero.badge')}
              </p>
              <h1
                className='font-display text-4xl md:text-5xl font-black mb-4 text-cream tracking-[-0.02em]'
                // style={{ color: 'hsl(var(--cream))', letterSpacing: '-0.02em' }}
              >
                {/* Hero title: main heading text */}
                {tCourses('hero.titlePrefix')}
                <span style={{ color: 'hsl(var(--green-mint))' }}>
                  {tCourses('hero.titleHighlight')}
                </span>
              </h1>
              <p
                className='font-ui text-lg max-w-xl'
                style={{ color: 'hsla(40,82%,88%,0.65)' }}
              >
                {/* Hero subtitle: supporting description under title */}
                {tCourses('hero.subtitle')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section
        className='px-[5%] py-16'
        style={{ background: 'hsl(var(--cream-dark))' }}
      >
        <div className='max-w-[1200px] mx-auto'>
          <div className='flex items-center justify-between mb-8'>
            {/* Learning Paths heading: section title */}
            <h2 className='font-display text-2xl font-black text-foreground'>
              {tCourses('paths.sectionTitle')}
            </h2>
            <Link
              href='/paths'
              className='font-ui text-sm font-semibold px-4 py-2 rounded-lg border transition-colors btn-primary flex items-center justify-center'
            >
              {/* Learning Paths CTA: explore all paths button */}
              {tCourses('paths.exploreAll')}
            </Link>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {PATHS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <PathCard
                  path={{
                    ...p,
                    tag: cards[i]?.tag ?? p.tag,
                    title: cards[i]?.title ?? p.title,
                    desc: cards[i]?.desc ?? p.desc,
                    modules: p.modules.map((m, j) => ({
                      ...m,
                      label: cards[i]?.modules?.[j] ?? m.label,
                    })),
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters + Course Grid */}
      <section className='px-[5%] py-16 bg-background'>
        <div className='max-w-[1200px] mx-auto'>
          <div className='flex items-center justify-between mb-8'>
            {/* Courses heading: section title for course catalog */}
            <h2 className='font-display text-2xl font-black text-foreground'>
              {tCourses('courses.sectionTitle')}
            </h2>
            <span className='font-ui text-sm text-muted-foreground'>
              {/* Courses count: shows number of courses or loading placeholder */}
              {isLoading
                ? tCourses('courses.loading')
                : tCourses('courses.count', { count: filtered.length })}
            </span>
          </div>

          {/* Search + Filters */}
          <div className='flex flex-col md:flex-row gap-4 mb-8'>
            <div className='relative flex-1'>
              <Search
                size={16}
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground'
                strokeWidth={1.5}
              />
              <input
                type='text'
                // Search input placeholder: prompt to search courses
                placeholder={tCourses('search.placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full h-11 pl-10 pr-4 rounded-lg font-ui text-sm bg-card border outline-hidden transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,140,76,0.35)]'
              />
            </div>
            <div className='flex gap-2 flex-wrap'>
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className='font-ui text-xs font-semibold px-3 py-2 rounded-lg border transition-all'
                  style={{
                    background:
                      difficulty === d
                        ? 'hsl(var(--green-primary))'
                        : 'transparent',
                    color:
                      difficulty === d
                        ? 'hsl(var(--cream))'
                        : 'hsl(var(--foreground))',
                    borderColor:
                      difficulty === d
                        ? 'hsl(var(--green-primary))'
                        : 'rgba(27,35,29,0.2)',
                  }}
                >
                  {/* Difficulty filter label */}
                  {tCourses(`filters.difficulty.${d}`)}
                </button>
              ))}
            </div>
            <div className='flex gap-2 flex-wrap'>
              {topics.map((topicItem) => (
                <button
                  key={topicItem}
                  onClick={() => setTopic(topicItem)}
                  className='font-ui text-xs font-semibold px-3 py-2 rounded-lg border transition-all'
                  style={{
                    background:
                      topic === topicItem
                        ? 'rgba(0,140,76,0.1)'
                        : 'transparent',
                    color:
                      topic === topicItem
                        ? 'hsl(var(--green-primary))'
                        : 'hsl(var(--foreground))',
                    borderColor:
                      topic === topicItem
                        ? 'rgba(0,140,76,0.2)'
                        : 'rgba(27,35,29,0.2)',
                  }}
                >
                  {/* Topic filter label */}
                  {tCourses(`filters.topic.${topicItem}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[...Array(6)].map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filtered.map((course: UICourse, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className='text-center py-20'>
              <Search
                size={56}
                className='mx-auto mb-4'
                style={{ color: 'rgba(27,35,29,0.18)' }}
                strokeWidth={1.5}
              />
              <h3
                className='font-display text-xl font-bold'
                style={{ color: 'rgba(27,35,29,0.5)' }}
              >
                {/* Empty state title: no courses found */}
                {tCourses('empty.title')}
              </h3>
              <p
                className='font-ui text-sm mt-2'
                style={{ color: 'rgba(27,35,29,0.35)' }}
              >
                {/* Empty state subtitle: suggestion to adjust filters */}
                {tCourses('empty.subtitle')}
              </p>
              <button
                onClick={() => {
                  setDifficulty('All')
                  setTopic('All')
                  setSearch('')
                }}
                className='mt-4 font-ui text-sm font-semibold px-4 py-2 rounded-lg border transition-colors'
                style={{ borderColor: 'rgba(27,35,29,0.2)' }}
              >
                {/* Empty state action: clear all filters button */}
                {tCourses('empty.clearFilters')}
              </button>
            </div>
          )}
        </div>
      </section>
    </StandardLayout>
  )
}

export default Courses
