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

### LeaderboardService
```typescript
interface LeaderboardService {
  getLeaderboardEntries(timeframe: 'weekly' | 'monthly' | 'all_time', limit?: number): Promise<LeaderboardEntry[]>;
  getUserRank(walletAddress: string, timeframe: 'weekly' | 'monthly' | 'all_time'): Promise<number>;
  getTopXpEarners(limit?: number): Promise<LeaderboardEntry[]>;
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

### AchievementService
```typescript
interface AchievementService {
  getAchievements(walletAddress: string): Promise<Achievement[]>;
  checkAndAwardAchievements(walletAddress: string, action: string): Promise<Achievement[]>;
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Wallet + OAuth authentication |
| GET | /api/courses | List courses |
| GET | /api/courses/:slug | Get course details |
| POST | /api/enroll | Enroll in course |
| POST | /api/progress | Update lesson progress |
| GET | /api/leaderboard | Get XP rankings (supports ?timeframe=weekly\|monthly\|all_time) |
| GET | /api/leaderboard/:wallet/rank | Get user's rank |
| GET | /api/achievements | Get user achievements |
| POST | /api/achievements/check | Check and award new achievements |
| POST | /api/admin/auth | Admin authentication |
| GET | /api/admin/stats | Admin dashboard statistics |
| POST | /api/admin/award-xp | Award XP to user |

## Data Models

### LeaderboardEntry
```typescript
interface LeaderboardEntry {
  wallet: string;
  displayName: string;
  xp: number;
  level: number;
  rank: number;
  streak: number;
}
```

### XpSummary
```typescript
interface XpSummary {
  totalXp: number;
  level: number;
  rank: number;
  earnedFrom: { lesson: number; achievement: number; bonus: number };
}
```

### StreakData
```typescript
interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}
```

### Credential
```typescript
interface Credential {
  mintAddress: string;
  courseName: string;
  xpEarned: number;
  level: number;
  issueDate: string;
  metadataUrl: string;
}
```
