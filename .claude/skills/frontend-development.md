# Superteam Academy — Frontend Development Guide

This document provides patterns, best practices, and architectural guidelines for developing the Solana Academy Platform frontend.

## Technology Stack Reference

| Purpose | Technology | Version |
| --- | --- | --- |
| Framework | Next.js | 14.2+ |
| React | React | 18.3+ |
| Language | TypeScript | 5.5+ |
| Styling | Tailwind CSS | 3.4+ |
| State (Client) | Zustand | 4.5+ |
| State (Server) | TanStack Query | 5.48+ |
| Wallet | @solana/wallet-adapter-react | 0.15+ |
| Code Editor | @monaco-editor/react | 4.7+ |
| i18n | next-intl | 3.15+ |
| UI Components | lucide-react | 0.400+ |
| Animation | framer-motion | 11.2+ |
| Package Manager | npm | 9+ |

## Folder Structure

```
app/                          ← Next.js app directory
  layout.tsx
  page.tsx
  courses/
  dashboard/
  ...

components/                   ← Reusable React components
  courses/
    CourseCard.tsx
    CourseCatalog.tsx
    index.ts
  dashboard/
    GamificationUI.tsx
    index.ts
  editor/
    CodeEditor.tsx
    ChallengeRunner.tsx
    index.ts
  layout/
    Header.tsx
    Footer.tsx
    index.ts
  ui/                        ← Base UI components
    Button.tsx
    Card.tsx
    Input.tsx
    index.ts

lib/
  hooks/                     ← Custom React hooks
    useI18n.tsx
    useLearningProgress.ts
    index.ts
  services/                  ← Business logic services
    course.service.ts
    learning-progress.service.ts
    index.ts
  i18n/                      ← Internationalization
    translations.ts
  types/                     ← TypeScript interfaces
    index.ts
  utils/                     ← Utility functions
    cn.ts                    ← Class name merging

public/                       ← Static assets
  images/
  icons/
  fonts/
```

## Component Structure & Patterns

### Base Component Template

```typescript
'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  // ... other props
}

/**
 * ComponentName
 * 
 * Description of what this component does.
 * 
 * @example
 * <ComponentName prop="value">
 *   Content
 * </ComponentName>
 */
export const ComponentName: React.FC<ComponentProps> = ({
  className,
  children,
  // ... destructure other props
}) => {
  return (
    <div className={cn('base-class', className)}>
      {children}
    </div>
  );
};

ComponentName.displayName = 'ComponentName';
```

### Page Component Example

```typescript
import { Metadata } from 'next';
import { CourseCard } from '@/components/courses';

export const metadata: Metadata = {
  title: 'Courses | Solana Academy',
  description: 'Browse all available courses',
};

export default function CoursesPage() {
  return (
    <main className="container mx-auto">
      <h1>Courses</h1>
      {/* Page content */}
    </main>
  );
}
```

## State Management Patterns

### Zustand Store Example

```typescript
// lib/stores/learner.store.ts
import { create } from 'zustand';
import { Learner } from '@/lib/types';

interface LearnerStore {
  learner: Learner | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLearner: (learner: Learner) => void;
  updateProgress: (courseId: string, xp: number) => void;
  logout: () => void;
}

export const useLearnerStore = create<LearnerStore>((set) => ({
  learner: null,
  isLoading: false,
  error: null,
  
  setLearner: (learner) => set({ learner }),
  
  updateProgress: (courseId, xp) =>
    set((state) => ({
      learner: state.learner
        ? {
            ...state.learner,
            totalXP: state.learner.totalXP + xp,
          }
        : null,
    })),
  
  logout: () => set({ learner: null }),
}));
```

### TanStack Query Example

```typescript
// lib/hooks/useCourses.ts
import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '@/lib/services/course.service';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}
```

## Service Layer Patterns

### Service Template

```typescript
// lib/services/custom.service.ts

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

class CustomService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  private async fetch<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: options?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`Fetch failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  async getData<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint);
  }
  
  async postData<T>(endpoint: string, body: any): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'POST', body });
  }
}

export const customService = new CustomService();
```

## Styling Guidelines

### Tailwind CSS Best Practices

```typescript
// ✅ DO: Use utility classes
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click me
</button>

// ❌ DON'T: Create custom CSS
<style>.custom-button { padding: 0.5rem 1rem; }</style>

// ✅ DO: Use cn() for conditional classes
<div className={cn('bg-gray-100', isActive && 'bg-blue-500')}>
  Content
</div>

// ✅ DO: Use responsive prefixes
<div className="w-full md:w-1/2 lg:w-1/3">
  Responsive width
</div>

// ✅ DO: Organize Tailwind classes
<button className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded transition-colors hover:bg-blue-600 disabled:opacity-50">
  Styled Button
</button>
```

## Hook Patterns

### useI18n Hook

```typescript
// lib/hooks/useI18n.tsx
'use client';

import { useLocale } from 'next-intl';
import { translations } from '@/lib/i18n/translations';

type Language = keyof typeof translations;

export function useI18n() {
  const locale = useLocale() as Language;
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };
  
  return { t, locale };
}
```

### Custom Hook for Async Data

```typescript
// lib/hooks/useLearningProgress.ts
'use client';

import { useEffect, useState } from 'react';
import { learningProgressService } from '@/lib/services';

export function useLearningProgress(learnerId: string) {
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        setIsLoading(true);
        const data = await learningProgressService.getLearnerProgress(learnerId);
        if (isMounted) {
          setProgress(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, [learnerId]);
  
  return { progress, isLoading, error };
}
```

## Error Handling Strategy

### Error Boundary Component

```typescript
// components/ErrorBoundary.tsx
'use client';

import React, { ReactNode, ReactError } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-500 rounded bg-red-50">
            <h2 className="text-red-800 font-bold">Something went wrong</h2>
            <p className="text-red-600 text-sm mt-2">
              {this.state.error?.message}
            </p>
          </div>
        )
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Patterns

### Component Test Example

```typescript
// components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
  
  it('calls onClick handler when clicked', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(onClick).toHaveBeenCalledOnce();
  });
  
  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Next.js Advanced Patterns

### Server Components Query

```typescript
// app/courses/page.tsx
import { courseService } from '@/lib/services';

export default async function CoursesPage() {
  const courses = await courseService.getAllCourses();
  
  return (
    <div>
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

### Route Handlers (API Routes)

```typescript
// app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '24';
    
    // Fetch from backend
    const data = await fetch(
      `${process.env.BACKEND_URL}/courses?page=${page}&limit=${limit}`
    ).then((r) => r.json());
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
```

## Performance Best Practices

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src={course.thumbnail}
  alt={course.title}
  width={300}
  height={200}
  placeholder="blur"
  quality={75}
  priority={false} // Only use for above-the-fold images
/>
```

### Dynamic Component Loading

```typescript
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false, // Don't render on server
});

export default function LessonPage() {
  return <CodeEditor />;
}
```

## Code Quality Standards

### ESLint Configuration

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "@next/next/no-html-link-for-pages": "off",
    "react/display-name": "warn",
    "react-hooks/rules-of-hooks": "error"
  }
}
```

### TypeScript Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

## Common Gotchas & Solutions

### Hydration Mismatch

```typescript
// ❌ Problem: Server-rendered value differs from client
export default function Component() {
  const [count, setCount] = useState(Math.random());
  return <div>{count}</div>;
}

// ✅ Solution: Use useEffect for client-only values
export default function Component() {
  const [count, setCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    setCount(Math.random());
  }, []);
  
  if (!isMounted) return null;
  return <div>{count}</div>;
}
```

### Missing Async Handling

```typescript
// ❌ Problem: Fetching inside useEffect without cleanup
useEffect(() => {
  fetch('/api/data').then(setData);
}, []);

// ✅ Solution: Add abort signal & cleanup
useEffect(() => {
  const controller = new AbortController();
  
  fetch('/api/data', { signal: controller.signal })
    .then((r) => r.json())
    .then(setData)
    .catch((err) => {
      if (err.name !== 'AbortError') {
        setError(err);
      }
    });
  
  return () => controller.abort();
}, []);
```

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintained By**: Superteam Academy Team
