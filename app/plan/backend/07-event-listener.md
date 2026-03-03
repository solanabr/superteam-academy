# Event Listener Service

**Status**: Backend API implementation. Monitors deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |

---

## Overview

The Event Listener Service monitors on-chain events for real-time updates and analytics.

## Events (15 Total)

### Enrollment Events
- `Enrolled` - Learner enrolled in course
- `LessonCompleted` - Lesson completed
- `CourseFinalized` - Course completed
- `EnrollmentClosed` - Enrollment closed

### Credential Events
- `CredentialIssued` - New credential NFT created
- `CredentialUpgraded` - Existing credential updated

### XP Events
- `XpRewarded` - XP minted to user

### Admin Events
- `ConfigUpdated` - Backend signer rotated
- `CourseCreated` - New course added
- `CourseUpdated` - Course modified

### Minter Events
- `MinterRegistered` - New minter added
- `MinterRevoked` - Minter removed

### Achievement Events
- `AchievementAwarded` - Achievement given
- `AchievementTypeCreated` - Achievement type created
- `AchievementTypeDeactivated` - Achievement retired

## Event Structures

```typescript
// Enrolled
interface EnrolledEvent {
  learner: PublicKey;
  course: PublicKey;
  timestamp: number;
}

// LessonCompleted
interface LessonCompletedEvent {
  learner: PublicKey;
  course: PublicKey;
  lessonIndex: number;
  xpEarned: number;
  timestamp: number;
}

// CourseFinalized
interface CourseFinalizedEvent {
  learner: PublicKey;
  course: PublicKey;
  totalXp: number;
  bonusXp: number;
  creator: PublicKey;
  creatorXp: number;
  timestamp: number;
}

// CredentialIssued
interface CredentialIssuedEvent {
  learner: PublicKey;
  credentialAsset: PublicKey;
  trackId: number;
  credentialName: string;
  coursesCompleted: number;
  totalXp: number;
  timestamp: number;
}

// CredentialUpgraded
interface CredentialUpgradedEvent {
  learner: PublicKey;
  credentialAsset: PublicKey;
  credentialName: string;
  coursesCompleted: number;
  totalXp: number;
  timestamp: number;
}

// XpRewarded
interface XpRewardedEvent {
  recipient: PublicKey;       // Note: This is ATA, not wallet
  amount: number;
  minter: PublicKey;
  label: string;
  timestamp: number;
}

// AchievementAwarded
interface AchievementAwardedEvent {
  achievementId: string;
  recipient: PublicKey;
  asset: PublicKey;
  xpReward: number;
  timestamp: number;
}
```

## Implementation

### 1. Subscribe to Program Events

```typescript
function subscribeToEvents(
  program: Program<SuperteamAcademy>,
  eventHandler: (event: any) => void
): EventSubscription[]
```

### 2. Parse Events from Transaction Logs

```typescript
async function parseEventsFromTx(
  txHash: string,
  programId: PublicKey
): Promise<ParsedEvent[]>
```

### 3. Event Handler

```typescript
async function handleEvent(event: any): Promise<void> {
  switch (event.name) {
    case 'lessonCompleted':
      await handleLessonCompleted(event.data);
      break;
    case 'courseFinalized':
      await handleCourseFinalized(event.data);
      break;
    case 'credentialIssued':
      await handleCredentialIssued(event.data);
      break;
    case 'enrollmentClosed':
      await handleEnrollmentClosed(event.data);
      break;
    // ... handle other events
  }
}
```

## Event Handlers

### Lesson Completed Handler
- Update learner's progress in cache
- Update leaderboard
- Send notification

### Course Finalized Handler
- Update course completion count
- Update leaderboard
- Check for achievement eligibility
- Send congratulations notification

### Credential Issued Handler
- Update credential cache
- Send credential notification
- Update user profile

### Achievement Awarded Handler
- Update achievements cache
- Send achievement notification

## Storage

```typescript
// Redis for recent events
// Key: "event:{eventType}:{txHash}"
// Value: JSON.stringify(event)

// PostgreSQL for analytics
interface EventLog {
  id: number;
  eventType: string;
  txHash: string;
  timestamp: number;
  data: JSON;
  processed: boolean;
}
```

## Real-time Notifications

```typescript
// WebSocket to frontend
interface WebSocketMessage {
  type: 'event';
  eventType: string;
  data: any;
}

// Notification types:
// - lesson_completed
// - course_completed
// - credential_earned
// - achievement_unlocked
// - xp_received
```

## Restart Recovery

On service restart:
1. Fetch recent transactions (last 24h)
2. Parse events from transaction logs
3. Process missed events
4. Resume event subscription
