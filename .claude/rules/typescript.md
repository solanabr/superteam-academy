# TypeScript Code Standards for Solana dApps

## Type Safety

### Strict Mode (Required)

All files must use `strict: true` in `tsconfig.json`.

```typescript
// ✅ DO: Use strict types
const amount: number = 100;
const user: User = { name: 'Alice' };
function getTotalXP(learner: Learner): number {
  return learner.totalXP;
}

// ❌ DON'T: Use any
const amount: any = 100;
const user: any = { name: 'Alice' };
function getTotalXP(learner: any): any {
  return learner.totalXP;
}
```

### Optional vs Null

```typescript
// ✅ DO: Use optional chaining for optional properties
const email = user?.profile?.email;

// ✅ DO: Use nullish coalescing for defaults
const displayName = user.name ?? 'Anonymous';

// ❌ DON'T: Assume properties exist
const email = user.profile.email; // TypeError: Cannot read property 'profile' of undefined

// ❌ DON'T: Use logical OR for falsy values
const displayName = user.name || 'Anonymous'; // Wrong for empty string or 0
```

## Interface & Type Definitions

### Naming Conventions

```typescript
// ✅ DO: Use PascalCase for types
type UserProfile = { name: string; email: string };
interface Learner { id: string; enrollments: Enrollment[]; }

// ✅ DO: Differentiate with suffixes
type CourseDTO = { /* API response */ };
type CourseModel = { /* internal model */ };
interface CourseService { /* service interface */ }

// ❌ DON'T: Use I prefix for interfaces (outdated convention)
interface ILearner { }
```

### Immutability

```typescript
// ✅ DO: Use readonly for immutable data
interface Config {
  readonly authority: PublicKey;
  readonly backendSigner: PublicKey;
}

// ✅ DO: Use const assertions for literal types
const xpLevels = [100, 250, 500] as const;
type XPLevel = typeof xpLevels[number]; // 100 | 250 | 500

// ❌ DON'T: Mutate function parameters
function updateLearner(learner: Learner) {
  learner.totalXP = 0; // Bad! Mutates external state
}

// ✅ DO: Return new objects
function updateLearner(learner: Learner): Learner {
  return { ...learner, totalXP: 0 };
}
```

## Error Handling

### Typed Errors

```typescript
// ✅ DO: Create custom error types
class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ✅ DO: Use Result types for operations that might fail
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function parseJSON<T>(json: string): Result<T> {
  try {
    return { ok: true, value: JSON.parse(json) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error('Parse failed') };
  }
}

// ❌ DON'T: Catch unknown types
catch (error) {
  // error is 'any' without instanceof check
}

// ✅ DO: Always check error type
catch (error) {
  if (error instanceof APIError) {
    // Handle API error
  } else if (error instanceof Error) {
    // Handle standard error
  } else {
    // Handle unknown error
  }
}
```

## Async/Await Patterns

```typescript
// ✅ DO: Use async/await over promises
async function fetchCourses(): Promise<Course[]> {
  const response = await fetch('/api/courses');
  return response.json();
}

// ✅ DO: Handle errors explicitly
async function fetchCourses(): Promise<Course[]> {
  try {
    const response = await fetch('/api/courses');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    throw error;
  }
}

// ❌ DON'T: .catch() after await (confusing)
const courses = await fetch('/api/courses').catch(() => []);

// ✅ DO: Use AbortController for timeouts
async function fetchWithTimeout(url: string, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
```

## Function Signatures

```typescript
// ✅ DO: Explicit return types
function getUserName(user: User): string {
  return user.profile.name;
}

// ✅ DO: Document complex functions
/**
 * Calculates XP level based on total points
 * @param totalXP Total XP earned
 * @returns Level (0-based index)
 */
function getLevel(totalXP: number): number {
  const xpPerLevel = 100;
  return Math.floor(totalXP / xpPerLevel);
}

// ❌ DON'T: Use optional parameters for required args
function enrollCourse(courseId?: string) { } // courseId should be required

// ✅ DO: Order parameters: required → optional → callbacks
function processData(
  input: string,
  options?: { verbose?: boolean },
  callback?: (result: string) => void
) {}
```

## Generics

```typescript
// ✅ DO: Use generics for reusable logic
function createStore<T>(initialState: T) {
  return {
    get: () => initialState,
    set: (newState: T) => { /* ... */ }
  };
}

// ✅ DO: Constrain generic types
function getValue<T extends Record<string, any>>(obj: T, key: keyof T): T[keyof T] {
  return obj[key];
}

// ❌ DON'T: Use overly broad generics
function process<T>(data: T): T { /* ... */ } // Too generic, adds no value
```

## Constants & Enums

```typescript
// ✅ DO: Use const for static values
const MAX_DAILY_XP = 1000;
const SOLANA_DECIMALS = 9 as const;

// ✅ DO: Use enums for related constants
enum Difficulty {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

// ✅ DO: Use as const for literal type inference
const LANGUAGES = ['javascript', 'rust', 'typescript'] as const;
type Language = typeof LANGUAGES[number];

// ❌ DON'T: Use magic numbers
const xp = total / 1000; // What does 1000 mean?

// ✅ DO: Use named constants
const XP_PER_ACHIEVEMENT = 1000;
const xp = total / XP_PER_ACHIEVEMENT;
```

## Module Imports & Exports

```typescript
// ✅ DO: Use named exports for multiple items
export const courseService = { /* ... */ };
export function getUserProfile(id: string) { /* ... */ }

// ✅ DO: Use default export for single main export
export default function CourseCatalog() { /* ... */ }

// ✅ DO: Group related imports
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '@/lib/services';
import type { Course, Learner } from '@/lib/types';

// ❌ DON'T: Mix default and named exports from same module
export default Learner; // ???
export const getLearner = () => { }; // Confusing

// ✅ DO: Use path aliases
import { Button } from '@/components/ui';
import { courseService } from '@/lib/services';

// ❌ DON'T: Use relative deep paths
import Button from '../../../../../components/ui/Button';
```

## Null Safety

```typescript
// ✅ DO: Check for null before accessing properties
function getUserEmail(user: User | null): string | null {
  return user?.profile?.email ?? null;
}

// ✅ DO: Never return undefined (use null instead)
function getValue(key: string): string | null {
  return map.get(key) ?? null;
}

// ❌ DON'T: Return undefined
function getValue(key: string): string | undefined {
  return map.get(key) || undefined; // Explicit undefined is anti-pattern
}

// ✅ DO: Use Type Guards
function isLearner(user: unknown): user is Learner {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'enrollments' in user
  );
}

if (isLearner(data)) {
  console.log(data.enrollments); // Type-safe access
}
```

## Comments & Documentation

```typescript
// ✅ DO: Use JSDoc for public APIs
/**
 * Enrolls a learner in a course
 * @param learnerId - Unique learner identifier
 * @param courseId - Unique course identifier
 * @returns Enrollment record
 * @throws {CourseNotFoundError} If course doesn't exist
 */
async function enrollCourse(learnerId: string, courseId: string): Promise<Enrollment> {
  // ...
}

// ✅ DO: Document complex logic
// Sort by completion date (most recent first), then by XP earned
const sortedCompletions = completions.sort((a, b) =>
  b.completedAt.getTime() - a.completedAt.getTime() ||
  b.xpEarned - a.xpEarned
);

// ❌ DON'T: Comment obvious code
const user = User(); // Create user object

// ❌ DON'T: Leave outdated comments
// TODO: Fix this later (written 2 years ago)
```

## Performance Patterns

```typescript
// ✅ DO: Use memoization for expensive operations
const getMemoized = (() => {
  const cache = new Map<string, Result>();
  return (key: string): Result => {
    if (cache.has(key)) return cache.get(key)!;
    const result = expensiveComputation(key);
    cache.set(key, result);
    return result;
  };
})();

// ✅ DO: Use Set for membership checks (O(1))
const completedCourseIds = new Set(learner.completedCourses.map(c => c.id));
if (completedCourseIds.has(courseId)) { /* ... */ }

// ❌ DON'T: Use array.includes() for large arrays (O(n))
if (learner.completedCourses.map(c => c.id).includes(courseId)) { /* ... */ }

// ✅ DO: Lazy-load expensive modules
const editor = await import('@monaco-editor/react');
```

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintained By**: Superteam Academy Team
