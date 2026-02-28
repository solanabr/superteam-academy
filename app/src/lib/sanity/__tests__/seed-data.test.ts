import { describe, it, expect } from 'vitest';
import {
  seedTrack,
  seedCourseRaw,
  seedCourseDetail,
  seedLessons,
  seedLessonContents,
  seedAchievements,
  seedDailyChallenge,
} from '../seed-data';

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------

describe('seedTrack', () => {
  it('has required fields', () => {
    expect(seedTrack.trackId).toBeTruthy();
    expect(typeof seedTrack.trackId).toBe('string');

    expect(seedTrack.name).toBeTruthy();
    expect(typeof seedTrack.name).toBe('string');

    expect(seedTrack.color).toBeTruthy();
    expect(typeof seedTrack.color).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Course (raw)
// ---------------------------------------------------------------------------

describe('seedCourseRaw', () => {
  it('has valid structure', () => {
    expect(seedCourseRaw.courseId).toBeTruthy();
    expect(typeof seedCourseRaw.courseId).toBe('string');

    expect(seedCourseRaw.title.en).toBeTruthy();
    expect(typeof seedCourseRaw.title.en).toBe('string');

    expect(seedCourseRaw.description.en).toBeTruthy();
    expect(typeof seedCourseRaw.description.en).toBe('string');

    expect(['beginner', 'intermediate', 'advanced']).toContain(
      seedCourseRaw.difficulty,
    );

    expect(seedCourseRaw.lessonCount).toBeGreaterThan(0);
    expect(seedCourseRaw.xpPerLesson).toBeGreaterThan(0);

    expect(seedCourseRaw.track.trackId).toBeTruthy();
    expect(typeof seedCourseRaw.track.trackId).toBe('string');
  });

  it('lessonCount matches actual lessons', () => {
    expect(seedCourseRaw.lessonCount).toBe(seedLessons.length);
  });
});

// ---------------------------------------------------------------------------
// Course detail (modules + lessons)
// ---------------------------------------------------------------------------

describe('seedCourseDetail', () => {
  it('has modules with lessons', () => {
    expect(seedCourseDetail.modules.length).toBeGreaterThan(0);

    for (const mod of seedCourseDetail.modules) {
      expect(mod.lessons.length).toBeGreaterThan(0);
    }
  });

  it('total lessons match lessonCount', () => {
    const totalLessons = seedCourseDetail.modules.reduce(
      (sum, mod) => sum + mod.lessons.length,
      0,
    );
    expect(totalLessons).toBe(seedCourseRaw.lessonCount);
  });
});

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

describe('seedLessons', () => {
  it('have sequential indices', () => {
    const indices = seedLessons.map((l) => l.lessonIndex);
    const expected = Array.from({ length: seedLessons.length }, (_, i) => i);
    expect(indices).toEqual(expected);
  });

  it('with hasCodeEditor have starterCode', () => {
    const editorLessons = seedLessons.filter((l) => l.hasCodeEditor);
    expect(editorLessons.length).toBeGreaterThan(0);

    for (const lesson of editorLessons) {
      expect(lesson.starterCode).toBeTruthy();
      expect(typeof lesson.starterCode).toBe('string');
      expect(lesson.starterCode!.length).toBeGreaterThan(0);
    }
  });

  it('with isChallenge have testCases', () => {
    const challengeLessons = seedLessons.filter((l) => l.isChallenge);
    expect(challengeLessons.length).toBeGreaterThan(0);

    for (const lesson of challengeLessons) {
      expect(Array.isArray(lesson.testCases)).toBe(true);
      expect(lesson.testCases!.length).toBeGreaterThan(0);
    }
  });

  it('all have i18n titles', () => {
    for (const lesson of seedLessons) {
      expect(lesson.title.en).toBeTruthy();
      expect(typeof lesson.title.en).toBe('string');

      expect(lesson.title.pt).toBeTruthy();
      expect(typeof lesson.title.pt).toBe('string');

      expect(lesson.title.es).toBeTruthy();
      expect(typeof lesson.title.es).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Lesson contents
// ---------------------------------------------------------------------------

describe('seedLessonContents', () => {
  it('match seedLessons', () => {
    expect(seedLessonContents.length).toBe(seedLessons.length);

    const contentIndices = seedLessonContents
      .map((c) => c.lessonIndex)
      .sort((a, b) => a - b);
    const lessonIndices = seedLessons
      .map((l) => l.lessonIndex)
      .sort((a, b) => a - b);
    expect(contentIndices).toEqual(lessonIndices);
  });

  it('have all locales', () => {
    for (const content of seedLessonContents) {
      expect(Array.isArray(content.en)).toBe(true);
      expect(content.en.length).toBeGreaterThan(0);

      expect(Array.isArray(content.pt)).toBe(true);
      expect(content.pt.length).toBeGreaterThan(0);

      expect(Array.isArray(content.es)).toBe(true);
      expect(content.es.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

describe('seedAchievements', () => {
  it('have 12 entries', () => {
    expect(seedAchievements).toHaveLength(12);
  });

  it('have unique IDs', () => {
    const ids = seedAchievements.map((a) => a.achievementId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('have valid categories', () => {
    const validCategories = [
      'learning',
      'streak',
      'challenge',
      'social',
      'special',
      'progress',
      'skill',
    ];
    for (const achievement of seedAchievements) {
      expect(validCategories).toContain(achievement.category);
    }
  });
});

// ---------------------------------------------------------------------------
// Daily challenge
// ---------------------------------------------------------------------------

describe('seedDailyChallenge', () => {
  it('has required fields', () => {
    expect(seedDailyChallenge.date).toBeTruthy();
    expect(typeof seedDailyChallenge.date).toBe('string');

    expect(seedDailyChallenge.title.en).toBeTruthy();
    expect(typeof seedDailyChallenge.title.en).toBe('string');

    expect(['beginner', 'intermediate', 'advanced']).toContain(
      seedDailyChallenge.difficulty,
    );

    expect(Array.isArray(seedDailyChallenge.testCases)).toBe(true);
    expect(seedDailyChallenge.testCases.length).toBeGreaterThan(0);
  });

  it('testCases have points > 0', () => {
    for (const testCase of seedDailyChallenge.testCases) {
      expect(testCase.points).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// i18n content validation
// ---------------------------------------------------------------------------

describe('i18n content', () => {
  it('all i18n content is present and translations differ from en', () => {
    // Spot-check: course title translations differ
    expect(seedCourseRaw.title.pt).not.toBe(seedCourseRaw.title.en);
    expect(seedCourseRaw.title.es).not.toBe(seedCourseRaw.title.en);

    // Spot-check: first lesson title translations differ
    const firstLesson = seedLessons[0]!;
    expect(firstLesson.title.pt).not.toBe(firstLesson.title.en);
    expect(firstLesson.title.es).not.toBe(firstLesson.title.en);

    // Spot-check: first achievement name translations differ
    const firstAchievement = seedAchievements[0]!;
    expect(firstAchievement.name.pt).not.toBe(firstAchievement.name.en);
    expect(firstAchievement.name.es).not.toBe(firstAchievement.name.en);

    // Spot-check: lesson content en differs from pt
    const firstContent = seedLessonContents[0]!;
    const enText = firstContent.en.find((s) => s.type === 'text')?.content;
    const ptText = firstContent.pt.find((s) => s.type === 'text')?.content;
    expect(enText).toBeTruthy();
    expect(ptText).toBeTruthy();
    expect(ptText).not.toBe(enText);
  });
});
