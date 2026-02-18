# Level System

A comprehensive leveling system for gamified learning platforms. Provides XP progression, level management, challenges, rewards, notifications, and analytics.

## Features

- **XP-Based Progression**: Automatic level calculation based on user XP
- **Level Challenges**: Time-bound challenges with XP bonuses
- **Reward System**: Automatic and manual reward claiming
- **Notification System**: Real-time notifications for level ups, challenges, and rewards
- **Analytics**: Comprehensive analytics and insights
- **TypeScript**: Full type safety with discriminated unions

## Installation

```bash
bun add @superteam-academy/gamification
```

## Quick Start

```typescript
import { createLevelSystem } from '@superteam-academy/gamification';

const levelSystem = createLevelSystem();

// Initialize a user
const userLevel = levelSystem.initializeUser('user123', 150);
console.log(`User is at level ${userLevel.currentLevel}`);

// Update XP and handle level ups
const result = levelSystem.updateUserXP('user123', 300);
if (result.levelChanged) {
  console.log(`Leveled up from ${result.oldLevel} to ${result.newLevel}!`);
}

// Track user actions
levelSystem.lessonCompleted('user123');
levelSystem.challengeSolved('user123');

// Get notifications
const notifications = levelSystem.getUserNotifications('user123');
console.log(`User has ${notifications.length} notifications`);
```

## Core Concepts

### Levels
Each level has:
- XP requirements
- Automatic rewards (granted on level up)
- Manual rewards (user must claim)
- Associated challenges

### Challenges
Challenges are level-specific goals that provide bonus XP:
- **Lesson Completion**: Complete X lessons
- **Challenge Solving**: Solve X coding challenges
- **Streak Maintenance**: Maintain X-day streak
- **Course Completion**: Finish X courses
- **Referrals**: Refer X friends
- **Social Sharing**: Share X times
- **Time Spent**: Spend X hours learning

### Rewards
Rewards are granted for reaching levels:
- **XP Bonus**: Additional XP
- **Streak Freeze**: Emergency streak protection
- **Achievement Badge**: Special badges
- **Title**: User titles
- **Avatar Frame**: Cosmetic frames
- **Special Access**: Platform features
- **Discount**: Store discounts

## API Reference

### LevelSystem

#### User Management
```typescript
initializeUser(userId: string, totalXP?: number): UserLevel
getUserProgress(userId: string): UserLevel | null
updateUserXP(userId: string, newTotalXP: number): LevelUpResult
```

#### Challenge Tracking
```typescript
lessonCompleted(userId: string): ChallengeResult[]
challengeSolved(userId: string): ChallengeResult[]
streakMaintained(userId: string, streakLength: number): ChallengeResult[]
courseFinished(userId: string): ChallengeResult[]
referralMade(userId: string): ChallengeResult[]
socialShare(userId: string): ChallengeResult[]
timeSpent(userId: string, minutesSpent: number): ChallengeResult[]
```

#### Rewards
```typescript
claimReward(userId: string, level: number, rewardId: string): ClaimResult
getAvailableRewards(userId: string): LevelReward[]
```

#### Notifications
```typescript
getUserNotifications(userId: string, options?: NotificationOptions): LevelNotification[]
markNotificationAsRead(userId: string, notificationId: string): boolean
markAllNotificationsAsRead(userId: string): number
deleteNotification(userId: string, notificationId: string): boolean
```

#### Analytics
```typescript
getAnalytics(): LevelAnalytics
getUserAnalytics(userId: string): UserAnalytics | null
getLevelInsights(): LevelInsights
generateProgressionReport(userId: string): ProgressionReport | null
```

### Types

```typescript
interface UserLevel {
  userId: string;
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
  levelProgress: number; // 0-100
  completedChallenges: string[];
  claimedRewards: string[];
  levelReachedAt: Date;
  lastUpdated: Date;
}

interface LevelUpResult {
  levelChanged: boolean;
  oldLevel: number;
  newLevel: number;
  rewards: LevelReward[];
  challenges: LevelChallenge[];
}

interface ChallengeResult {
  challengeId: string;
  wasCompleted: boolean;
  xpAwarded: number;
}
```

## Advanced Usage

### Custom Levels

```typescript
const customLevels: Level[] = [
  {
    level: 1,
    name: 'Apprentice',
    xpRequired: 0,
    rewards: [{ type: RewardType.TITLE, value: 'Apprentice', description: 'Earn apprentice title', isAutomatic: true }],
    challenges: [{ type: ChallengeType.LESSONS_COMPLETED, target: 3, description: 'Complete 3 lessons', xpBonus: 50, timeLimit: 7 }],
    description: 'Begin your journey',
    icon: '🎓',
    color: '#3b82f6'
  }
];

const levelSystem = createLevelSystem({ customLevels });
```

### Event Handling

```typescript
levelSystem.onNotification('level_up', (notification) => {
  console.log(`User ${notification.userId} leveled up!`);
  // Send push notification, update UI, etc.
});
```

### Analytics Integration

```typescript
// Get comprehensive analytics
const analytics = levelSystem.getAnalytics();
console.log(`Average level: ${analytics.globalStats.averageLevel}`);

// Generate user report
const report = levelSystem.generateProgressionReport('user123');
if (report) {
  console.log(`Recommendations: ${report.recommendations.join(', ')}`);
}
```

### Challenge Recommendations

```typescript
const recommendations = levelSystem.getRecommendedChallenges('user123', 3);
recommendations.forEach(rec => {
  console.log(`${rec.priority}: ${rec.reason}`);
  console.log(`Progress: ${rec.progressPercent}%`);
});
```

## Default Level Configuration

The system includes 10 default levels (1-10) with increasing XP requirements and comprehensive challenges. See `DEFAULT_LEVELS` for the complete configuration.

## Testing

```bash
# Run tests
bun test

# Run with coverage
bun run test:coverage

# Run in watch mode
bun run test:watch
```

## Building

```bash
# Build for production
bun run build

# Build in watch mode
bun dev
```

## Architecture

The level system is composed of several interconnected engines:

- **LevelProgressionEngine**: Core level calculation and user progression
- **LevelChallengeTracker**: Challenge progress tracking and completion
- **LevelNotificationsEngine**: Notification creation and management
- **LevelAnalyticsEngine**: Analytics and insights generation
- **ChallengeRecommendationEngine**: Smart challenge recommendations

All components are designed with TypeScript strict mode and comprehensive error handling.
