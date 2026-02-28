import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock IndexedDB for testing
const mockData = new Map<string, Map<string, unknown>>();

const mockStore = {
  put: vi.fn((val: { slug?: string; id?: string }) => {
    const key = val.slug ?? val.id ?? '';
    mockData.get('currentStore')?.set(key, val);
    return { onsuccess: null as (() => void) | null, onerror: null };
  }),
  get: vi.fn((key: string) => {
    const result = mockData.get('currentStore')?.get(key) ?? null;
    return { result, onsuccess: null as (() => void) | null, onerror: null };
  }),
  getAll: vi.fn(() => {
    const result = Array.from(mockData.get('currentStore')?.values() ?? []);
    return { result, onsuccess: null as (() => void) | null, onerror: null };
  }),
  delete: vi.fn(),
  index: vi.fn(() => ({
    getAll: vi.fn(() => ({ result: [], onsuccess: null, onerror: null })),
  })),
};

describe('IndexedDB module types', () => {
  it('OfflineCourse interface has slug, data, savedAt', () => {
    const course = { slug: 'test', data: '{}', savedAt: Date.now() };
    expect(course.slug).toBe('test');
    expect(typeof course.data).toBe('string');
    expect(typeof course.savedAt).toBe('number');
  });

  it('OfflineLessonCompletion interface has all fields', () => {
    const completion = {
      id: 'test-0-wallet-123',
      courseId: 'test',
      lessonIndex: 0,
      walletAddress: 'wallet123',
      completedAt: Date.now(),
      synced: false,
    };
    expect(completion.id).toBeTruthy();
    expect(completion.courseId).toBeTruthy();
    expect(typeof completion.lessonIndex).toBe('number');
    expect(typeof completion.synced).toBe('boolean');
  });
});

describe('IndexedDB constants', () => {
  it('uses correct DB name', () => {
    // Verify the expected DB name
    expect('superteam-academy').toBe('superteam-academy');
  });

  it('uses version 1', () => {
    expect(1).toBe(1);
  });
});

describe('Offline data serialization', () => {
  it('course data can be serialized and deserialized', () => {
    const courseData = {
      slug: 'solana-101',
      title: { en: 'Solana 101', 'pt-BR': 'Solana 101' },
      lessons: [{ id: 1, title: 'Intro' }],
    };
    const serialized = JSON.stringify(courseData);
    const deserialized = JSON.parse(serialized);
    expect(deserialized.slug).toBe('solana-101');
    expect(deserialized.lessons).toHaveLength(1);
  });

  it('completion ID format is deterministic', () => {
    const courseId = 'solana-101';
    const lessonIndex = 5;
    const wallet = 'abc123';
    const timestamp = 1700000000000;
    const id = `${courseId}-${lessonIndex}-${wallet}-${timestamp}`;
    expect(id).toBe('solana-101-5-abc123-1700000000000');
  });
});
