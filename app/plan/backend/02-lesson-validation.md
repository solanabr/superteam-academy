# Lesson Validation Service

**Status**: Backend API implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |

---

## Overview

The Lesson Validation Service validates that learners have actually completed course content before the backend signs off on lesson completion. This is the anti-cheat layer.

## Validation Workflow

```
Learner → Frontend → Content (Arweave) → Quiz/Assessment → Backend Validation → Transaction
```

## Responsibilities

1. **Content Verification** - Verify learner accessed content on Arweave
2. **Quiz/Assessment Validation** - Validate quiz scores meet threshold
3. **Rate Limiting** - Prevent rapid-fire lesson completions
4. **Fraud Detection** - Detect suspicious patterns
5. **Lesson Order Enforcement** - Ensure sequential progression (optional)

## Functions to Implement

### 1. Validate Lesson Completion

```typescript
interface LessonValidationRequest {
  learner: PublicKey;
  courseId: string;
  lessonIndex: number;
  contentTxId: string;      // Arweave transaction ID
  quizScore?: number;        // Optional quiz score
  timeSpent: number;         // Time spent on lesson (seconds)
  timestamp: number;
}

interface LessonValidationResult {
  valid: boolean;
  reason?: string;
  xpReward: number;
}

async function validateLessonCompletion(
  request: LessonValidationRequest
): Promise<LessonValidationResult>
```

**Validation Rules:**
- Content transaction exists on Arweave
- Learner wallet has viewed the content (off-chain tracking)
- Quiz score >= threshold (if quiz exists)
- Minimum time spent >= threshold
- No rapid completion (< 30s between lessons)
- No duplicate submissions

### 2. Check Content Access

```typescript
async function checkContentAccess(
  learner: PublicKey,
  contentTxId: string
): Promise<boolean>
```

### 3. Validate Quiz Score

```typescript
async function validateQuizScore(
  courseId: string,
  lessonIndex: number,
  score: number
): Promise<{ passed: boolean; threshold: number }>
```

### 4. Rate Limit Check

```typescript
interface RateLimitConfig {
  maxLessonsPerHour: number;
  minTimeBetweenLessons: number;  // seconds
}

async function checkRateLimit(
  learner: PublicKey,
  courseId: string,
  config: RateLimitConfig
): Promise<boolean>
```

### 5. Fraud Detection

```typescript
interface FraudIndicator {
  type: 'rapid_completion' | 'suspicious_pattern' | 'bot_detection';
  severity: 'low' | 'medium' | 'high';
  details: string;
}

async function detectFraud(
  learner: PublicKey,
  courseId: string,
  lessonHistory: LessonValidationRequest[]
): Promise<FraudIndicator[]>
```

## Storage Schema (Redis)

```typescript
// Key: "lesson_access:{learner}:{courseId}:{lessonIndex}"
// Value: JSON.stringify({ timestamp, txId })

// Key: "rate_limit:{learner}:{courseId}"
// Value: JSON.stringify({ lessonCount, windowStart })

// Key: "fraud_flags:{learner}"
// Value: JSON.stringify({ flags: FraudIndicator[] })
```

## Configuration

```typescript
const VALIDATION_CONFIG = {
  minTimeSpent: 30,           // seconds
  quizPassThreshold: 70,      // percentage
  rateLimit: {
    maxLessonsPerHour: 10,
    minTimeBetween: 30,      // seconds
  },
  fraudDetection: {
    enablePatternAnalysis: true,
    enableBotDetection: true,
  }
};
```

## Events Emitted

- `LessonValidationPassed` - When validation succeeds
- `LessonValidationFailed` - When validation fails
- `FraudDetected` - When fraud is detected
- `RateLimitExceeded` - When rate limit is hit
