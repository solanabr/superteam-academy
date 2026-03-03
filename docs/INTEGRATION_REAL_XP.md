# Integration Guide: Real XP Earning with Courses

This guide shows how to integrate real XP earning into your courses.

## Quick Start (5 minutes)

### 1. Verify Everything is Set Up

```bash
cd backend
npm run verify-xp
```

You should see:
```
✅ Supabase connected
✅ users
✅ enrollments  
✅ lesson_progress
✅ xp_transactions
✅ Top 5 users by XP...
```

### 2. Run the Demo

```bash
cd backend
npx tsx setup-real-xp-course.ts
```

This creates a test learner, enrolls them in a course, completes lessons, and awards XP.

### 3. Check Your Course in Sanity

Navigate to Sanity Studio and:
1. Open a course
2. Scroll to **"XP Reward for Completion"** field
3. Enter an XP amount (e.g., 500)
4. Save

Do the same for each lesson:
1. Open a lesson
2. Find **"XP Reward"** field  
3. Enter XP amount (e.g., 100)
4. Save

## Implementation Checklist

### Course Configuration

- [ ] Course has `xpReward` set in Sanity (e.g., 500 XP for entire course)
- [ ] Each lesson has `xpReward` set (e.g., 100 XP per lesson)
- [ ] Course has a unique `slug` identifier
- [ ] Lessons have unique IDs

### Component Integration

For lesson pages using the **ChallengeRunner**:

```tsx
import { ChallengeRunner } from '@/components/editor'

export default function LessonPage() {
  return (
    <ChallengeRunner
      courseId={course.id}           // ← Required!
      lessonId={lesson.id}           // ← Required!
      xpReward={lesson.xpReward}     // ← Optional (auto-calculated if omitted)
      starterCode={lesson.challenge.starterCode}
      testCases={lesson.challenge.testCases}
    />
  )
}
```

For custom lesson pages with submit button:

```tsx
import { useAwardXP } from '@/lib/hooks'

export default function MyLessonPage() {
  const { awardXP, isAwarding, isAuthenticated } = useAwardXP()

  const handleSubmit = async () => {
    const result = await awardXP({
      courseId: course.id,
      lessonId: lesson.id,
      xpAmount: lesson.xpReward,
    })

    if (result.success) {
      alert(`✅ +${result.xpAwarded} XP earned!`)
    }
  }

  return (
    <button onClick={handleSubmit} disabled={isAwarding || !isAuthenticated}>
      Submit & Earn {lesson.xpReward} XP
    </button>
  )
}
```

### API Route (Already Implemented)

The `/api/xp/award` endpoint handles:
- ✅ Enrollment verification
- ✅ Duplicate prevention
- ✅ XP transaction recording
- ✅ User level calculation
- ✅ Database updates

**No additional implementation needed!**

## Real-World Example

### Solana Basics Course

**Course Setup**:
```
Course: "Solana Basics"
ID: "solana-basics"
Total XP Reward: 500 (on completion)

Module 1: Getting Started
  ├─ Lesson 1: "Blockchain Fundamentals" (100 XP)
  ├─ Lesson 2: "Solana Architecture" (100 XP)
  └─ Lesson 3: "Setting Up Dev Environment" (100 XP)

Module 2: Programming
  ├─ Lesson 4: "Writing Your First Program" (100 XP)
  └─ Lesson 5: "Deploying to Devnet" (100 XP)
```

**Learner Flow**:

1. **Enroll**: Click "Start Course"
   ```
   → User enrolled
   → Enrollment created: xp_earned = 0
   ```

2. **Complete Lesson 1**: Pass all tests → Click "Claim Rewards"
   ```
   → API: POST /api/xp/award { courseId, lessonId, xpAmount: 100 }
   → lesson_progress created
   → enrollments.xp_earned = 100
   → users.total_xp = 100
   → users.level = 1
   ```

3. **Complete Lessons 2-5**: Repeat for each lesson
   ```
   → After Lesson 2: total_xp = 200, level = 1
   → After Lesson 3: total_xp = 300, level = 1
   → After Lesson 4: total_xp = 400, level = 2
   → After Lesson 5: total_xp = 500, level = 2
   ```

4. **Dashboard Updates**: Automatically show
   ```
   Total XP: 500 ⭐
   Level: 2 📈
   Streak: 5 days 🔥
   ```

## Setting Up a New Course

### Step 1: Create in Sanity

```bash
# In Sanity Studio, create a new document
Name: "Advanced Rust Programming"
Slug: "advanced-rust"
XP Reward: 750
```

### Step 2: Create Learning Modules

Add modules with lessons. Each lesson:
- Type: "Challenge"
- XP Reward: 150

### Step 3: Create Lesson Content

Content can use Markdown with code examples:
``````markdown
# Assignment: Build a Token Program

## Overview
Create a token transfer program in Rust.

## Starter Code
```rust
#[program]
pub mod token_program {
    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        // TODO: Implement transfer
        Ok(())
    }
}
```

## Test Cases
Your solution must:
- [ ] Transfer tokens
- [ ] Update balances
- [ ] Emit event
``````

### Step 4: Add Test Cases

In the Challenge section:

```json
{
  "starterCode": "...",
  "testCases": [
    {
      "input": "transfer 100 to Alice",
      "expectedOutput": "Success",
      "description": "Transfer tokens to user"
    },
    {
      "input": "check balance Alice",
      "expectedOutput": "100",
      "description": "Verify balance updated"
    }
  ]
}
```

## Verification

### Check XP was Awarded

**SQL**:
```sql
-- View user's total XP
SELECT email, total_xp, level FROM users WHERE email = 'student@example.com';

-- View enrollments with XP earned
SELECT course_id, xp_earned, completion_percentage 
FROM enrollments 
WHERE user_id = 'student@example.com';

-- View lesson completions
SELECT lesson_id, completed_at 
FROM lesson_progress 
WHERE user_id = 'student@example.com';

-- View XP transactions
SELECT amount, reason, created_at 
FROM xp_transactions 
WHERE user_id = 'student@example.com'
ORDER BY created_at DESC;
```

**Dashboard**:
1. Sign in as the learner
2. Go to `/dashboard`
3. Check "Total XP" and "Level" display
4. Should show earned XP

### Test Endpoint

```bash
# Award 100 XP to a user
curl -X POST http://localhost:3000/api/xp/award \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test@example.com",
    "courseId": "solana-basics",
    "lessonId": "lesson-1",
    "xpAmount": 100
  }'

# Response:
{
  "xpAwarded": 100,
  "totalXp": 250,
  "level": 1,
  "message": "XP awarded successfully"
}
```

## Troubleshooting

### Issue: "Enrollment not found"

**Cause**: User is not enrolled in the course

**Solution**:
1. Go to course page
2. Click "Start Course"
3. Verify in database:
   ```sql
   SELECT * FROM enrollments WHERE user_id = 'USER_EMAIL';
   ```

### Issue: "Lesson already completed"

**Cause**: User already earned XP for this lesson

**Solution**: This is by design (prevent duplicate XP). To test again:
```sql
DELETE FROM lesson_progress 
WHERE user_id = 'USER_EMAIL' AND lesson_id = 'LESSON_ID';
```

### Issue: "User not authenticated"

**Cause**: User is not logged in

**Solution**:
1. Sign in at `/auth/signin`
2. Try again

### Issue: XP not showing on dashboard

**Cause**: Dashboard hasn't refreshed

**Solution**:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Check browser console for errors
3. Verify XP was awarded in SQL

## Performance Optimization

For courses with many enrollments:

### Query Optimization

```sql
-- Index for fast enrollment lookups
CREATE INDEX idx_enrollments_user_course 
ON enrollments(user_id, course_id);

-- Index for leaderboard queries
CREATE INDEX idx_users_total_xp 
ON users(total_xp DESC);

-- Index for lesson progress tracking
CREATE INDEX idx_lesson_progress_user_lesson 
ON lesson_progress(user_id, lesson_id);
```

### Caching

Add Redis caching for user stats (if needed):

```typescript
// Cache user XP for 5 minutes
const cacheKey = `user:${userId}:xp`
const cached = await redis.get(cacheKey)

if (cached) {
  return JSON.parse(cached)
}

const stats = await fetchUserXP(userId)
await redis.setex(cacheKey, 300, JSON.stringify(stats))
```

## Next Steps

- [ ] Set up all courses with XP values
- [ ] Configure lesson XP rewards
- [ ] Test with a demo course
- [ ] Monitor XP transactions
- [ ] Create leaderboard page
- [ ] Add XP notifications
- [ ] Implement XP streaks

## Related Documentation

- [REAL_XP_EARNING.md](./REAL_XP_EARNING.md) - System overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [LMS_ENROLLMENT_XP.md](./LMS_ENROLLMENT_XP.md) - Enrollment details

---

**Version**: 1.0.0  
**Updated**: February 24, 2026
