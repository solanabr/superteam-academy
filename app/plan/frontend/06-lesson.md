# Lesson Service

**Status**: Frontend implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |

---

## Overview

The Lesson Service handles lesson content display, progress tracking, and completion flow.

## Features

- Lesson content rendering (Markdown + code blocks)
- Progress tracking with auto-save
- Code challenge integration
- Previous/Next navigation
- Expandable hints and solutions

## Data Types

```typescript
// types/lesson.ts
export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  index: number;
  title: string;
  type: 'content' | 'challenge';
  duration: number; // minutes
  
  // Content fields
  content?: string; // Markdown
  videoUrl?: string;
  
  // Challenge fields
  challenge?: CodeChallenge;
  
  // Hints (expandable)
  hints?: string[];
  solution?: string;
  
  // XP
  xpReward: number;
}

export interface CodeChallenge {
  language: 'rust' | 'typescript' | 'json';
  starterCode: string;
  testCases: TestCase[];
  expectedOutput?: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface LessonProgress {
  lessonId: string;
  isCompleted: boolean;
  completedAt: Date | null;
  code?: string; // Saved code state
  testResults?: TestResult[];
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string;
  error?: string;
}
```

## Implementation

### 1. Lesson Service Interface

```typescript
// services/lesson-service.ts
import { Lesson, LessonProgress } from '@/types/lesson';

export interface ILessonService {
  // Fetch lesson content
  getLesson(courseId: string, lessonId: string): Promise<Lesson>;
  getLessonsByCourse(courseId: string): Promise<Lesson[]>;
  getLessonsByModule(courseId: string, moduleId: string): Promise<Lesson[]>;
  
  // Progress (stub for now, will connect to on-chain)
  getProgress(userId: string, courseId: string, lessonId: string): Promise<LessonProgress>;
  getAllProgress(userId: string, courseId: string): Promise<LessonProgress[]>;
  
  // Completion (stub - backend signs later)
  markComplete(userId: string, courseId: string, lessonId: string): Promise<void>;
  
  // Code saving (local storage for MVP)
  saveCode(courseId: string, lessonId: string, code: string): void;
  loadCode(courseId: string, lessonId: string): string | null;
}

// Stub implementation using local storage
export class LocalLessonService implements ILessonService {
  private progressKey = 'lesson_progress';
  private codeKey = 'lesson_code';
  
  async getLesson(courseId: string, lessonId: string): Promise<Lesson> {
    // Fetch from CMS
    const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
    return response.json();
  }
  
  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    const response = await fetch(`/api/courses/${courseId}/lessons`);
    return response.json();
  }
  
  async getProgress(userId: string, courseId: string, lessonId: string): Promise<LessonProgress> {
    const allProgress = this.getAllProgressSync(userId, courseId);
    return allProgress.find(p => p.lessonId === lessonId) || {
      lessonId,
      isCompleted: false,
      completedAt: null,
    };
  }
  
  async getAllProgress(userId: string, courseId: string): Promise<LessonProgress[]> {
    return this.getAllProgressSync(userId, courseId);
  }
  
  async markComplete(userId: string, courseId: string, lessonId: string): Promise<void> {
    // Stub - in production this would call backend to sign transaction
    const key = `${this.progressKey}_${userId}_${courseId}`;
    const stored = localStorage.getItem(key);
    const progress: LessonProgress[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = progress.findIndex(p => p.lessonId === lessonId);
    const updated: LessonProgress = {
      lessonId,
      isCompleted: true,
      completedAt: new Date(),
    };
    
    if (existingIndex >= 0) {
      progress[existingIndex] = updated;
    } else {
      progress.push(updated);
    }
    
    localStorage.setItem(key, JSON.stringify(progress));
    
    // Trigger XP reward (stub)
    await this.awardXP(userId, courseId, lessonId);
  }
  
  saveCode(courseId: string, lessonId: string, code: string): void {
    const key = `${this.codeKey}_${courseId}_${lessonId}`;
    localStorage.setItem(key, code);
  }
  
  loadCode(courseId: string, lessonId: string): string | null {
    const key = `${this.codeKey}_${courseId}_${lessonId}`;
    return localStorage.getItem(key);
  }
  
  private getAllProgressSync(userId: string, courseId: string): LessonProgress[] {
    const key = `${this.progressKey}_${userId}_${courseId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }
  
  private async awardXP(userId: string, courseId: string, lessonId: string): Promise<void> {
    // Stub - will call backend to mint XP on-chain
    console.log(`Awarding XP for lesson ${lessonId}`);
  }
}

// Service instance
export const lessonService = new LocalLessonService();
```

### 2. Lesson Hook

```typescript
// hooks/useLesson.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/services/lesson-service';
import { useAuth } from './useAuth';

export function useLesson(courseId: string, lessonId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const lesson = useQuery({
    queryKey: ['lesson', courseId, lessonId],
    queryFn: () => lessonService.getLesson(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });
  
  const progress = useQuery({
    queryKey: ['lessonProgress', user?.id, courseId, lessonId],
    queryFn: () => lessonService.getProgress(user!.id, courseId, lessonId),
    enabled: !!user?.id,
  });
  
  const markComplete = useMutation({
    mutationFn: () => lessonService.markComplete(user!.id, courseId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonProgress'] });
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });
    },
  });
  
  const saveCode = (code: string) => {
    lessonService.saveCode(courseId, lessonId, code);
  };
  
  const loadCode = () => {
    return lessonService.loadCode(courseId, lessonId);
  };
  
  return {
    lesson: lesson.data,
    isLoading: lesson.isLoading,
    progress: progress.data,
    markComplete,
    saveCode,
    loadCode,
    isCompleted: progress.data?.isCompleted ?? false,
  };
}
```

### 3. Lesson View Component

```typescript
// app/(dashboard)/courses/[slug]/lessons/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useLesson } from '@/hooks/useLesson';
import { LessonContent } from '@/components/lesson/LessonContent';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { LessonNavigation } from '@/components/lesson/LessonNavigation';
import { LoadingSpinner } from '@/components/ui/loading';

export default function LessonPage() {
  const params = useParams();
  const courseId = params.slug as string;
  const lessonId = params.id as string;
  
  const { 
    lesson, 
    isLoading, 
    progress, 
    markComplete, 
    saveCode, 
    loadCode,
    isCompleted 
  } = useLesson(courseId, lessonId);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!lesson) {
    return <div>Lesson not found</div>;
  }
  
  return (
    <div className="lesson-page">
      <div className="lesson-header">
        <h1>{lesson.title}</h1>
        <div className="meta">
          <span>{lesson.duration} min</span>
          <span>{lesson.xpReward} XP</span>
          {isCompleted && <span className="completed">✓ Completed</span>}
        </div>
      </div>
      
      <div className="lesson-content">
        {lesson.type === 'content' ? (
          <LessonContent content={lesson.content!} />
        ) : (
          <SplitLayout>
            <LessonContent content={lesson.content!} />
            <CodeEditor
              language={lesson.challenge!.language}
              starterCode={lesson.challenge!.starterCode}
              testCases={lesson.challenge!.testCases}
              savedCode={loadCode()}
              onSave={saveCode}
              onComplete={() => markComplete.mutate()}
              isCompleted={isCompleted}
            />
          </SplitLayout>
        )}
      </div>
      
      <LessonNavigation courseId={courseId} currentLessonId={lessonId} />
    </div>
  );
}
```

### 4. Lesson Content Component

```typescript
// components/lesson/LessonContent.tsx
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LessonContentProps {
  content: string;
}

export function LessonContent({ content }: LessonContentProps) {
  return (
    <div className="lesson-content prose dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';
            
            return match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

### 5. Auto-Save Hook

```typescript
// hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
  data: string;
  onSave: (data: string) => void;
  interval?: number; // ms
  debounce?: number; // ms
}

export function useAutoSave({ data, onSave, interval = 30000, debounce = 1000 }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  
  // Debounced save
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (data !== lastSavedRef.current) {
        onSave(data);
        lastSavedRef.current = data;
      }
    }, debounce);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, debounce]);
  
  // Periodic save
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (data !== lastSavedRef.current) {
        onSave(data);
        lastSavedRef.current = data;
      }
    }, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [data, onSave, interval]);
  
  // Save on unmount
  useEffect(() => {
    return () => {
      if (data !== lastSavedRef.current) {
        onSave(data);
      }
    };
  }, [data, onSave]);
}
```

## API Endpoints

```
GET  /api/courses/:courseId/lessons           # List lessons
GET  /api/courses/:courseId/lessons/:id       # Get lesson
GET  /api/courses/:courseId/lessons/:id/hints # Get hints (if unlocked)
GET  /api/courses/:courseId/lessons/:id/solution # Get solution (if completed)
```

## Progress Tracking Flow

```
1. User opens lesson
   → Load lesson content from CMS
   → Load progress from local storage / on-chain
   → Load saved code if exists

2. User works on challenge
   → Auto-save code every 30s + on change (debounced)
   → Show test results in real-time

3. User completes lesson
   → Mark complete locally
   → Call backend to sign complete_lesson transaction
   → Update XP locally (optimistic)
   → Show celebration animation

4. Navigate away
   → Auto-save any pending code
   → Update progress
```
