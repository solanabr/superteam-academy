# 🎉 Real XP Earning System - Quick Reference

## What You Now Have

✅ Learners can **earn real XP** when they complete lessons and challenges  
✅ XP is **instantly credited** to their account  
✅ Dashboard shows **updated XP and level**  
✅ Each lesson can only award XP **once** (no cheating)  
✅ **Fully integrated** with Supabase database  

## Get Started in 3 Steps

### Step 1: Verify Everything Works (2 minutes)

```bash
cd backend
npm run verify-xp
```

### Step 2: See a Demo (3 minutes)

```bash
cd backend
npx tsx setup-real-xp-course.ts
```

Creates a test learner, enrolls them, completes lessons, awards 300 XP total.

### Step 3: Set Up Your Course (5 minutes)

In Sanity CMS:

1. **Open a course**
   - Set "XP Reward for Completion" → e.g., 500
   - Save

2. **Open a lesson**  
   - Set "XP Reward" → e.g., 100
   - Save

3. **Repeat for all lessons**

That's it! Now when learners complete that course's lessons, they'll earn real XP.

## How It Works

### For Learners

1. Sign in to the platform
2. Enroll in a course
3. Complete a lesson/challenge (pass all tests)
4. See "Claim Rewards" button
5. Click button → Get XP
6. Dashboard updates → See new XP and level

### For Developers

```typescript
// Import the hook
import { useAwardXP } from '@/lib/hooks'

// Use in component
const { awardXP, isAwarding } = useAwardXP()

// Award XP
const result = await awardXP({
  courseId: 'course-1',
  lessonId: 'lesson-1', 
  xpAmount: 100
})

// result.success, result.xpAwarded, result.totalXp, result.level
```

## Files to Review

### Core Implementation
- [lib/hooks/useAwardXP.ts](lib/hooks/useAwardXP.ts) - The XP hook (25 lines)
- [components/editor/ChallengeRunner.tsx](components/editor/ChallengeRunner.tsx) - Updated UI

### Documentation  
- [docs/REAL_XP_EARNING.md](docs/REAL_XP_EARNING.md) - Complete guide
- [docs/INTEGRATION_REAL_XP.md](docs/INTEGRATION_REAL_XP.md) - Integration guide
- [XP_EARNING_IMPLEMENTATION_COMPLETE.md](XP_EARNING_IMPLEMENTATION_COMPLETE.md) - Summary

### Testing
- [backend/setup-real-xp-course.ts](backend/setup-real-xp-course.ts) - Demo script
- [backend/verify-real-xp.ts](backend/verify-real-xp.ts) - Verification script

## API Reference (Already Implemented)

### Award XP
```
POST /api/xp/award

{
  "userId": "user@example.com",
  "courseId": "solana-basics",
  "lessonId": "lesson-1",
  "xpAmount": 100
}

Response:
{
  "xpAwarded": 100,
  "totalXp": 350,
  "level": 1,
  "message": "XP awarded successfully"
}
```

## Database Changes

Everything is already in place:
- ✅ `users` table (total_xp, level)
- ✅ `enrollments` table (xp_earned)
- ✅ `lesson_progress` table (tracks completions)
- ✅ `xp_transactions` table (audit trail)

## Npm Scripts

```bash
# Verify XP system is working
npm run verify-xp

# Run demo (create test learner, enroll, award XP)  
npm run setup-real-xp

# Watch backend for changes
npm run dev
```

## Level Calculation

```
Level = FLOOR(√(Total XP / 100))

Examples:
- 0 XP → Level 0
- 100 XP → Level 1  
- 400 XP → Level 2
- 900 XP → Level 3
- 2500 XP → Level 5
```

## Common Tasks

### Check User's XP

```sql
SELECT email, total_xp, level, created_at
FROM users 
WHERE email = 'student@example.com';
```

### View Course Enrollments with XP

```sql
SELECT user_id, course_id, xp_earned, completion_percentage
FROM enrollments
WHERE course_id = 'solana-basics'
ORDER BY xp_earned DESC;
```

### Undo XP Award (Test/Debug)

```sql
-- Delete completion record
DELETE FROM lesson_progress
WHERE user_id = 'test@example.com' AND lesson_id = 'lesson-1';

-- Recalculate user XP (manual)
UPDATE users
SET total_xp = (
  SELECT COALESCE(SUM(amount), 0) 
  FROM xp_transactions 
  WHERE user_id = 'test@example.com'
),
level = FLOOR(SQRT(COALESCE(
  SELECT SUM(amount), 0) FROM xp_transactions 
  WHERE user_id = 'test@example.com') / 100))
WHERE id = 'test@example.com';
```

## Troubleshooting

**Q: "Enrollment not found" error**  
A: User must be enrolled in course first. Check `/enrollments` table.

**Q: "Lesson already completed" error**  
A: This is by design! Each lesson awards XP once. To test again:
```sql
DELETE FROM lesson_progress WHERE user_id = 'X' AND lesson_id = 'Y';
```

**Q: XP not showing?**  
A: Hard refresh (Cmd+Shift+R). Check browser console for errors.

**Q: Level not updating?**  
A: Check `users` table. Level auto-calculates. Restart app if stuck.

## Next Steps

1. ✅ Verify with `npm run verify-xp`
2. ✅ Demo with `npm run setup-real-xp`  
3. ✅ Configure your courses in Sanity
4. ✅ Have learners start earning XP!

## Support

- Full docs: [docs/REAL_XP_EARNING.md](docs/REAL_XP_EARNING.md)
- Integration: [docs/INTEGRATION_REAL_XP.md](docs/INTEGRATION_REAL_XP.md)
- Code: [lib/hooks/useAwardXP.ts](lib/hooks/useAwardXP.ts)

---

**Everything is ready! Your learners can now earn real XP.** 🚀

Run `npm run verify-xp` to confirm the system is working.
