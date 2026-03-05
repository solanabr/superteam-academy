# Backend

This folder contains stub interfaces for future backend services.

## Service Abstractions

All services follow a clean interface pattern that allows swapping between local storage and on-chain data:

### LearningProgressService
```typescript
interface LearningProgressService {
  getXpSummary(walletAddress?: string): Promise<XpSummary>;
  getStreak(walletAddress?: string): Promise<StreakData>;
  getCredentials(walletAddress?: string): Promise<Credential[]>;
  getEnrollments(walletAddress?: string): Promise<Enrollment[]>;
}
```

### CourseService
```typescript
interface CourseService {
  getCourses(): Promise<Course[]>;
  getCourse(slug: string): Promise<Course | null>;
  getLessons(courseSlug: string): Promise<Lesson[]>;
  getLesson(courseSlug: string, lessonId: string): Promise<Lesson | null>;
}
```

### EnrollmentAction
```typescript
interface EnrollmentAction {
  enroll(courseSlug: string): Promise<{ success: boolean; txHash?: string }>;
  closeEnrollment(courseSlug: string): Promise<{ success: boolean; txHash?: string }>;
}
```

## Future Implementation

When implementing the backend:
1. Replace local storage calls with API endpoints
2. Add authentication middleware
3. Add rate limiting
4. Add caching layer (Redis)
5. Connect to on-chain program for XP awards

## API Endpoints (Future)

- `POST /api/auth/login` - Wallet + OAuth authentication
- `GET /api/courses` - List courses
- `POST /api/enroll` - Enroll in course
- `POST /api/progress` - Update lesson progress
- `GET /api/leaderboard` - Get XP rankings
