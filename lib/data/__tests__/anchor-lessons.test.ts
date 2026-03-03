import { describe, it, expect } from 'vitest'
import { ANCHOR_LESSONS, enrichAnchorLesson, type Lesson } from '../anchor-lessons'

const baseLessons: Lesson = {
  id: 'test',
  title: 'Test Lesson',
  type: 'content',
  content: 'Some content',
  order: 1,
  xpReward: 50,
}

describe('ANCHOR_LESSONS', () => {
  it('contains all 5 anchor lesson keys', () => {
    const keys = Object.keys(ANCHOR_LESSONS)
    expect(keys).toContain('anchor-intro')
    expect(keys).toContain('anchor-accounts')
    expect(keys).toContain('anchor-pda')
    expect(keys).toContain('anchor-errors')
    expect(keys).toContain('anchor-typescript')
    expect(keys).toHaveLength(5)
  })

  it('each lesson has a challenge with required fields', () => {
    for (const [key, lesson] of Object.entries(ANCHOR_LESSONS)) {
      expect(lesson.type).toBe('challenge')
      expect(lesson.challenge).toBeDefined()
      expect(lesson.challenge!.prompt).toBeTruthy()
      expect(lesson.challenge!.starterCode).toBeTruthy()
      expect(lesson.challenge!.testCases.length).toBeGreaterThan(0)
      expect(lesson.challenge!.hints.length).toBeGreaterThan(0)
    }
  })

  it('anchor-typescript uses typescript language', () => {
    expect(ANCHOR_LESSONS['anchor-typescript'].language).toBe('typescript')
  })

  it('all other lessons use rust language', () => {
    for (const key of ['anchor-intro', 'anchor-accounts', 'anchor-pda', 'anchor-errors']) {
      expect(ANCHOR_LESSONS[key].language).toBe('rust')
    }
  })
})

describe('enrichAnchorLesson', () => {
  it('returns lesson unchanged for non-anchor courses', () => {
    const result = enrichAnchorLesson(baseLessons, 'solana-basics')
    expect(result).toEqual(baseLessons)
  })

  it('enriches by exact ID match', () => {
    const lesson: Lesson = { ...baseLessons, id: 'anchor-pda', title: 'Some Title' }
    const result = enrichAnchorLesson(lesson, 'anchor-course')
    expect(result.type).toBe('challenge')
    expect(result.challenge?.prompt).toContain('PDA')
  })

  it('fuzzy matches "typescript" in title', () => {
    const lesson: Lesson = { ...baseLessons, title: 'Using TypeScript Client' }
    const result = enrichAnchorLesson(lesson, 'anchor-course')
    expect(result.challenge?.prompt).toContain('TypeScript')
  })

  it('fuzzy matches "error" in title', () => {
    const lesson: Lesson = { ...baseLessons, title: 'Custom Error Handling' }
    const result = enrichAnchorLesson(lesson, 'anchor-course')
    expect(result.challenge?.prompt).toContain('error')
  })

  it('fuzzy matches "pda" in title', () => {
    const lesson: Lesson = { ...baseLessons, title: 'Working with PDAs' }
    const result = enrichAnchorLesson(lesson, 'anchor-course')
    expect(result.challenge?.prompt).toContain('PDA')
  })

  it('fuzzy matches "account" in title', () => {
    const lesson: Lesson = { ...baseLessons, title: 'Understanding Accounts' }
    const result = enrichAnchorLesson(lesson, 'anchor-course')
    expect(result.challenge?.prompt).toContain('Counter')
  })

  it('fuzzy matches "intro" in title', () => {
    const lesson: Lesson = { ...baseLessons, title: 'Introduction to Anchor' }
    const result = enrichAnchorLesson(lesson, 'anchor-course')
    expect(result.challenge?.prompt).toContain('Hello from Anchor')
  })

  it('defaults to anchor-intro for unmatched lessons', () => {
    const lesson: Lesson = { ...baseLessons, title: 'Miscellaneous Topic', order: 5 }
    const result = enrichAnchorLesson(lesson, 'anchor-course')
    expect(result.challenge?.prompt).toContain('Anchor')
  })

  it('preserves original lesson properties', () => {
    const lesson: Lesson = { ...baseLessons, id: 'anchor-intro', xpReward: 200, content: 'Custom content' }
    const result = enrichAnchorLesson(lesson, 'anchor-course')
    expect(result.xpReward).toBe(200) // Anchor lesson doesn't override xpReward since it's not in the partial
    expect(result.content).toBe('Custom content')
    expect(result.type).toBe('challenge') // Overridden by anchor data
  })
})
