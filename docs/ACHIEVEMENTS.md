# Achievement System

The achievement system tracks learner progress and unlocks badges based on specific criteria.

## Overview

Achievements are unlocked automatically when users meet certain criteria:
- Complete lessons
- Complete courses
- Earn XP thresholds
- Maintain streaks
- Complete multiple lessons in a day

## Architecture

### Service Layer (`lib/services/achievement.service.ts`)

The `AchievementService` manages:
- Achievement definitions and criteria
- Checking if criteria are met
- Tracking unlocked achievements per user
- Retrieving achievement data

```typescript
const service = getAchievementServiceInstance()

// Check and unlock achievements
const newlyUnlocked = service.checkAndUnlockAchievements(userId, {
  totalXp: 500,
  totalLessonsCompleted: 10,
  totalCoursesCompleted: 2,
  currentStreak: 5,
  lessonsCompletedToday: 3,
})

// Get all achievements
const all = service.getAllAchievements()

// Get unlocked achievements
const unlocked = service.getUnlockedAchievements(userId)
```

### Hook (`lib/hooks/useAchievements.ts`)

The `useAchievements` hook manages achievement state in React components:

```typescript
const { unlockedAchievements, newlyUnlocked, dismissNewlyUnlocked } = useAchievements({
  userId: 'user-123',
  stats: {
    totalXp: 500,
    totalLessonsCompleted: 10,
    totalCoursesCompleted: 2,
    currentStreak: 5,
    lessonsCompletedToday: 3,
  },
})
```

### Components

#### AchievementBadge
Displays a single achievement with icon, title, and unlock status.

```typescript
<AchievementBadge
  achievement={achievement}
  isUnlocked={true}
/>
```

#### AchievementGrid
Displays all achievements in a responsive grid.

```typescript
<AchievementGrid
  achievements={allAchievements}
  unlockedIds={new Set(['first-lesson', 'course-complete'])}
/>
```

#### AchievementNotification
Toast notification for newly unlocked achievements.

```typescript
{newlyUnlocked.map((achievement) => (
  <AchievementNotification
    key={achievement.id}
    achievement={achievement}
    onDismiss={dismissNewlyUnlocked}
  />
))}
```

## Available Achievements

| ID | Title | Description | Criteria | Rarity |
|---|---|---|---|---|
| `first-lesson` | First Steps | Complete your first lesson | 1 lesson | Common |
| `course-complete` | Course Master | Complete your first course | 1 course | Rare |
| `three-courses` | Triple Threat | Complete 3 courses | 3 courses | Epic |
| `xp-100` | XP Collector | Earn 100 XP | 100 XP | Common |
| `xp-500` | XP Master | Earn 500 XP | 500 XP | Rare |
| `xp-1000` | XP Legend | Earn 1000 XP | 1000 XP | Legendary |
| `streak-3` | On Fire | Maintain a 3-day streak | 3 days | Rare |
| `streak-7` | Week Warrior | Maintain a 7-day streak | 7 days | Epic |
| `five-lessons-day` | Speed Learner | Complete 5 lessons in one day | 5 lessons/day | Rare |

## Adding New Achievements

1. Add to `ACHIEVEMENTS` array in `lib/services/achievement.service.ts`:

```typescript
{
  id: 'new-achievement',
  title: 'Achievement Title',
  description: 'Achievement description',
  icon: '🎯',
  category: 'progress',
  criteria: { type: 'xp_threshold', value: 2000 },
  rarity: 'epic',
}
```

2. Supported criteria types:
   - `lesson_complete` - Number of lessons completed
   - `course_complete` - Number of courses completed
   - `xp_threshold` - Total XP earned
   - `streak` - Current streak days
   - `lessons_in_day` - Lessons completed in a single day

3. Rarity levels affect styling:
   - `common` - Gray border
   - `rare` - Blue border
   - `epic` - Purple border
   - `legendary` - Yellow border

## Integration Points

### Dashboard
Displays unlocked achievements and shows notifications when new ones are earned.

### Profile Page
Shows all achievements with unlock status and progress toward locked ones.

### Lesson Completion
Automatically checks achievements when a lesson is completed.

## Data Flow

```
User completes lesson
    ↓
Lesson XP awarded
    ↓
useGamification hook updates stats
    ↓
useAchievements hook checks criteria
    ↓
New achievements unlocked
    ↓
AchievementNotification displays toast
    ↓
AchievementGrid updates UI
```

## Future Enhancements

- [ ] Achievement categories/filters
- [ ] Achievement progress tracking (e.g., "3/7 days for Week Warrior")
- [ ] Seasonal achievements
- [ ] Social sharing of achievements
- [ ] Achievement leaderboard
- [ ] Rare/hidden achievements
- [ ] Achievement rewards (bonus XP, special badges)
