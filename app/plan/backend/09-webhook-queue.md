# Webhook & Queue Service

**Status**: Backend API implementation. Supports deployed devnet program operations.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |

---

## Overview

The Webhook & Queue Service handles asynchronous processing, webhooks, and background jobs.

## Queue Jobs

### 1. Transaction Processing
```typescript
interface TransactionJob {
  type: 'complete_lesson' | 'finalize_course' | 'issue_credential';
  payload: {
    learner: PublicKey;
    courseId: string;
    lessonIndex?: number;
    // ...
  };
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
}
```

### 2. Notification Jobs
```typescript
interface NotificationJob {
  type: 'email' | 'push' | 'in_app';
  recipient: string;
  template: string;
  data: Record<string, any>;
}
```

### 3. Analytics Jobs
```typescript
interface AnalyticsJob {
  type: 'track_event' | 'update_metrics';
  event: string;
  properties: Record<string, any>;
}
```

## Job Processing

### Enqueue Job
```typescript
async function enqueueJob(
  job: TransactionJob | NotificationJob | AnalyticsJob
): Promise<string> // job ID
```

### Process Job
```typescript
async function processJob(job: TransactionJob): Promise<void> {
  try {
    switch (job.type) {
      case 'complete_lesson':
        await processLessonCompletion(job.payload);
        break;
      case 'finalize_course':
        await processCourseFinalization(job.payload);
        break;
      case 'issue_credential':
        await processCredentialIssuance(job.payload);
        break;
    }
  } catch (error) {
    if (job.retryCount < job.maxRetries) {
      await requeueJob({ ...job, retryCount: job.retryCount + 1 });
    } else {
      await sendToDeadLetterQueue(job, error);
    }
  }
}
```

## Webhooks

### Configure Webhooks
```typescript
interface WebhookConfig {
  url: string;
  events: string[];  // ['lesson_completed', 'course_completed', etc.]
  secret: string;
  active: boolean;
}

async function registerWebhook(
  config: WebhookConfig
): Promise<{ webhookId: string }>
```

### Send Webhook
```typescript
async function sendWebhook(
  webhookUrl: string,
  event: string,
  payload: any,
  secret: string
): Promise<void> {
  const signature = await generateSignature(payload, secret);
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Event': event,
    },
    body: JSON.stringify(payload),
  });
}
```

### Webhook Events
- `lesson.completed` - When lesson is marked complete
- `course.completed` - When course is finalized
- `credential.issued` - When credential NFT is minted
- `achievement.unlocked` - When achievement is awarded
- `xp.received` - When XP is rewarded

## Background Jobs

### Scheduled Jobs (Cron)

```typescript
// Every hour
cron.schedule('0 * * * *', async () => {
  await refreshLeaderboard();
  await syncPendingTransactions();
});

// Every day at midnight
cron.schedule('0 0 * * *', async () => {
  await generateDailyReport();
  await archiveOldEvents();
});

// Every week
cron.schedule('0 0 * * 0', async () => {
  await generateWeeklyReport();
  await cleanupOldData();
});
```

### Job Workers

```typescript
// Worker processes
const workers = {
  transactionWorker: processTransactionJobs,
  notificationWorker: processNotificationJobs,
  analyticsWorker: processAnalyticsJobs,
  webhookWorker: processWebhooks,
};
```

## Dead Letter Queue

```typescript
interface DeadLetterJob {
  job: any;
  error: string;
  failedAt: number;
  retryCount: number;
}

async function getDeadLetterJobs(): Promise<DeadLetterJob[]>
async function retryDeadLetterJob(jobId: string): Promise<void>
```

## Monitoring

```typescript
interface QueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  deadLetter: number;
}

async function getQueueMetrics(): Promise<QueueMetrics>
```
