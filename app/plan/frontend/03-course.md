# Course Service

**Status**: Frontend implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |

---

## Overview

The Course Service handles course browsing, details, and content fetching.

## Data Types

```typescript
// types/index.ts
export interface Course {
  courseId: string;
  coursePda: string;
  creator: string;
  contentTxId: string;
  lessonCount: number;
  difficulty: 1 | 2 | 3;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  isActive: boolean;
  prerequisite: string | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  totalCompletions: number;
}

export interface CourseWithDetails extends Course {
  title: string;
  description: string;
  thumbnail: string;
  lessons: Lesson[];
  creatorName?: string;
}

export interface Lesson {
  index: number;
  title: string;
  contentTxId: string;
  duration: number; // minutes
  quiz?: Quiz;
}

export interface Quiz {
  questions: QuizQuestion[];
  passThreshold: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}
```

## Functions

### Fetch All Courses

```typescript
// hooks/useCourses.ts
import { useQuery } from '@tanstack/react-query';
import { useProgram } from './useProgram';
import { deriveCoursePda, fetchAllCourses } from '@/lib/account';
import { PROGRAM_ID } from '@/lib/constants';

export function useCourses() {
  const { program } = useProgram();
  
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const courses = await program.account.course.all();
      return courses.map(c => ({
        ...c.account,
        courseId: c.account.courseId,
        coursePda: c.publicKey.toBase58(),
      })) as Course[];
    },
  });
}
```

### Fetch Active Courses

```typescript
export function useActiveCourses() {
  const { data: courses, ...rest } = useCourses();
  
  return {
    ...rest,
    data: courses?.filter(c => c.isActive) ?? [],
  };
}
```

### Fetch Course by ID

```typescript
export function useCourse(courseId: string) {
  const { program } = useProgram();
  const coursePda = deriveCoursePda(courseId, PROGRAM_ID);
  
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const course = await program.account.course.fetch(coursePda);
      return {
        ...course,
        courseId: course.courseId,
        coursePda: coursePda.toBase58(),
      } as Course;
    },
    enabled: !!courseId,
  });
}
```

### Fetch Courses by Track

```typescript
export function useCoursesByTrack(trackId: number) {
  const { data: courses, ...rest } = useCourses();
  
  return {
    ...rest,
    data: courses?.filter(c => c.trackId === trackId) ?? [],
  };
}
```

### Fetch Course Details with Content

```typescript
// hooks/useCourseDetails.ts
import { useQuery } from '@tanstack/react-query';

interface CourseDetails extends Course {
  title: string;
  description: string;
  thumbnail: string;
  lessons: Lesson[];
}

export function useCourseDetails(courseId: string, contentTxId: string) {
  const { data: course, ...rest } = useCourse(courseId);
  
  return useQuery({
    queryKey: ['courseDetails', courseId],
    queryFn: async () => {
      // Fetch content from Arweave
      const content = await fetchCourseContent(contentTxId);
      return {
        ...course,
        ...content,
      } as CourseDetails;
    },
    enabled: !!course && !!contentTxId,
  });
}

async function fetchCourseContent(contentTxId: string): Promise<{
  title: string;
  description: string;
  thumbnail: string;
  lessons: Lesson[];
}> {
  const response = await fetch(`https://arweave.net/${contentTxId}`);
  return response.json();
}
```

## Course Card Component

```typescript
// components/course/CourseCard.tsx
interface CourseCardProps {
  course: Course;
  onClick?: () => void;
}

export function CourseCard({ course, onClick }: CourseCardProps) {
  const difficultyColors = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-yellow-100 text-yellow-800',
    3: 'bg-red-100 text-red-800',
  };
  
  const trackNames: Record<number, string> = {
    1: 'Anchor',
    2: 'DeFi',
    3: 'Mobile',
    // ...
  };
  
  return (
    <div className="course-card" onClick={onClick}>
      <div className="thumbnail">
        <img src={course.thumbnail} alt={course.title} />
      </div>
      <div className="content">
        <span className="track">{trackNames[course.trackId]}</span>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="meta">
          <span className={`difficulty ${difficultyColors[course.difficulty]}`}>
            {['Easy', 'Medium', 'Hard'][course.difficulty - 1]}
          </span>
          <span className="lessons">{course.lessonCount} lessons</span>
          <span className="xp">{course.xpPerLesson} XP/lesson</span>
        </div>
      </div>
    </div>
  );
}
```

## Course List Component

```typescript
// components/course/CourseList.tsx
export function CourseList({ courses, loading }: { courses: Course[]; loading?: boolean }) {
  if (loading) {
    return <CourseListSkeleton />;
  }
  
  if (courses.length === 0) {
    return (
      <div className="empty-state">
        <p>No courses available</p>
      </div>
    );
  }
  
  return (
    <div className="course-grid">
      {courses.map(course => (
        <CourseCard key={course.courseId} course={course} />
      ))}
    </div>
  );
}
```

## Track Information

```typescript
export const TRACKS = [
  { id: 1, name: 'Anchor Developer', description: 'Build Solana programs with Anchor', color: 'purple' },
  { id: 2, name: 'DeFi Specialist', description: 'Learn DeFi protocols', color: 'blue' },
  { id: 3, name: 'Mobile Developer', description: 'Build mobile dApps', color: 'green' },
  { id: 4, name: 'NFT Creator', description: 'Create and manage NFTs', color: 'pink' },
  { id: 5, name: 'Gaming', description: 'Build blockchain games', color: 'orange' },
];
```
