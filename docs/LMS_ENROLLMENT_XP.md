# Production LMS: Enrollment & XP Tracking System

## Overview

A complete production-grade Learning Management System (LMS) that tracks course enrollments, awards XP for lesson completion, and updates user stats in real-time.

## Architecture

### API Routes

#### 1. **POST /api/enrollments**
Enrolls a user in a course and creates an enrollment record.

**Request:**
```json
{
  "userId": "user-email@example.com",
  "courseId": "course-1"
}
```

**Response:**
```json
{
  "id": "enrollment-123",
  "user_id": "user-email@example.com",
  "course_id": "course-1",
  "enrolled_at": "2024-02-15T10:30:00Z",
  "completion_percentage": 0,
  "xp_earned": 0
}
```

**Database Changes:**
- Creates record in `enrollments` table
- Tracks enrollment date and initial XP

#### 2. **POST /api/xp/award**
Awards XP when a lesson is completed.

**Request:**
```json
{
  "userId": "user-email@example.com",
  "courseId": "course-1",
  "lessonId": "lesson-6",
  "xpAmount": 150
}
```

**Response:**
```json
{
  "xpAwarded": 150,
  "totalXp": 650,
  "level": 2,
  "message": "XP awarded successfully"
}
```

**Database Changes:**
- Records lesson completion in `lesson_progress` table
- Updates `enrollments.xp_earned` for the course
- Records transaction in `xp_transactions` table
- Updates `users.total_xp` and `users.level`

### React Hooks

#### 1. **useEnrollment()**
Manages course enrollment.

```typescript
const { enrollCourse, loading, error } = useEnrollment()

const result = await enrollCourse(courseId)
// result: { success: boolean, message: string, enrollmentId?: string }
```

#### 2. **useLessonSubmission()**
Handles lesson submission and XP awarding.

```typescript
const { submitLesson, loading } = useLessonSubmission()

const result = await submitLesson(courseId, lessonId, xpReward)
// result: { success, xpAwarded, totalXp, level, message }
```

## Data Flow

### Enrollment Flow

```
User clicks "Enroll" button
    ↓
CourseCard component calls enrollCourse()
    ↓
POST /api/enrollments
    ↓
Backend creates enrollment record in Supabase
    ↓
Returns enrollment ID
    ↓
UI updates to show "Enrolled" status
    ↓
User can now access course lessons
```

### Lesson Completion & XP Flow

```
User completes lesson challenge
    ↓
Clicks "Submit Challenge & Earn XP" button
    ↓
LessonPage calls submitLesson()
    ↓
POST /api/xp/award
    ↓
Backend:
  1. Verifies enrollment exists
  2. Checks lesson not already completed
  3. Records lesson completion
  4. Updates enrollment XP
  5. Records XP transaction
  6. Updates user total XP and level
    ↓
Returns: { xpAwarded, totalXp, level }
    ↓
UI shows success message with XP earned
    ↓
Dashboard updates with new stats
    ↓
Achievement system checks for unlocks
```

## Database Schema

### enrollments table
```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  completion_percentage INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  UNIQUE(user_id, course_id)
);
```

### lesson_progress table
```sql
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  completed_at TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);
```

### xp_transactions table
```sql
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP
);
```

### users table (updated)
```sql
ALTER TABLE users ADD COLUMN total_xp INT DEFAULT 0;
ALTER TABLE users ADD COLUMN level INT DEFAULT 0;
```

## Component Integration

### CourseCard
- Shows enrollment button
- Uses `useEnrollment()` hook
- Updates UI on successful enrollment

```typescript
const { enrollCourse, loading } = useEnrollment()

const handleEnroll = async () => {
  const result = await enrollCourse(course.id)
  if (result.success) {
    setEnrolled(true)
  }
}
```

### LessonPage
- Shows "Submit Challenge" button
- Uses `useLessonSubmission()` hook
- Awards XP on successful submission

```typescript
const { submitLesson, loading } = useLessonSubmission()

const handleSubmit = async () => {
  const result = await submitLesson(courseId, lessonId, xpReward)
  if (result.success) {
    // Show success with XP earned
  }
}
```

### Dashboard
- Displays total XP and level
- Shows enrolled courses with progress
- Displays achievements
- Shows XP notifications

## XP System

### XP Rewards
- Each lesson has an `xpReward` value
- Awarded when lesson is completed
- Cannot be earned twice for same lesson

### Level Calculation
```typescript
level = Math.floor(Math.sqrt(totalXp / 100))
```

### Example Progression
- 0 XP → Level 0
- 100 XP → Level 1
- 400 XP → Level 2
- 900 XP → Level 3
- 1600 XP → Level 4

## Error Handling

### Enrollment Errors
- User not signed in
- Already enrolled in course
- Database errors

### XP Award Errors
- User not signed in
- Enrollment not found
- Lesson already completed
- Database errors

All errors return appropriate HTTP status codes and user-friendly messages.

## Security

### Authentication
- All endpoints require valid user session
- User ID extracted from NextAuth session
- Email used as unique identifier

### Authorization
- Users can only enroll themselves
- Users can only submit their own lessons
- Backend verifies enrollment before awarding XP

### Data Validation
- Required fields checked
- Duplicate completion prevented
- XP amounts validated

## Performance

### Optimizations
- Single database query per enrollment
- Efficient XP transaction recording
- Batch updates where possible
- Indexed lookups on user_id and course_id

### Caching
- Dashboard stats cached via TanStack Query
- Enrollment status cached in component state
- Achievement checks debounced

## Future Enhancements

1. **Streak Tracking** - Track daily learning streaks
2. **Leaderboard** - Real-time XP rankings
3. **Badges** - Visual achievement badges
4. **Certificates** - On-chain credentials
5. **Referrals** - Bonus XP for referrals
6. **Challenges** - Timed challenges with bonus XP
7. **Multipliers** - Streak multipliers for XP
8. **Seasons** - Seasonal XP resets and rankings

## Testing

### Manual Testing Checklist
- [ ] Enroll in course successfully
- [ ] Cannot enroll twice
- [ ] Submit lesson and earn XP
- [ ] Cannot submit same lesson twice
- [ ] XP updates in dashboard
- [ ] Level increases correctly
- [ ] Achievements unlock on XP thresholds
- [ ] Error messages display correctly

### API Testing
```bash
# Enroll
curl -X POST http://localhost:3000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"userId":"user@example.com","courseId":"course-1"}'

# Award XP
curl -X POST http://localhost:3000/api/xp/award \
  -H "Content-Type: application/json" \
  -d '{"userId":"user@example.com","courseId":"course-1","lessonId":"lesson-1","xpAmount":50}'
```

## Deployment

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Database Setup
1. Create tables (see schema above)
2. Set up RLS policies for security
3. Create indexes on user_id and course_id
4. Enable real-time subscriptions (optional)

### Deployment Steps
1. Deploy to Vercel
2. Set environment variables
3. Run database migrations
4. Test enrollment and XP flows
5. Monitor error logs
