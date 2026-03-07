# Server Actions

This directory contains reusable server actions that can be called from any client component.

## XP Actions (`xp.actions.ts`)

### `awardXP(params)`

Awards XP to a user by their Better Auth ID.

**Parameters:**

- `betterAuthUserId` (string) - The Better Auth user ID
- `amount` (number) - Amount of XP to award
- `source` (string) - Source/reason for the XP (e.g., 'lesson-complete', 'quiz-passed', 'account-setup')

**Returns:**

- `{ success: true }` on success
- `{ success: false, error: string }` on failure

**Example Usage:**

```tsx
'use client'
import { awardXP } from '@/actions/xp.actions'

export function LessonCompleteButton({ userId }: { userId: string }) {
  const handleComplete = async () => {
    const result = await awardXP({
      betterAuthUserId: userId,
      amount: 50,
      source: 'lesson-complete',
    })

    if (result.success) {
      console.log('XP awarded successfully!')
    } else {
      console.error('Failed to award XP:', result.error)
    }
  }

  return <button onClick={handleComplete}>Complete Lesson</button>
}
```

**Common XP Sources:**

- `account-setup` - 100 XP for completing onboarding
- `lesson-complete` - 50 XP for completing a lesson
- `quiz-passed` - 75 XP for passing a quiz
- `course-complete` - 200 XP for completing a course
- `daily-login` - 10 XP for daily login streak
