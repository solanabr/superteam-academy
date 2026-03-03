# Notifications and Event System

## Table of Contents

- [Event System Architecture](#event-system-architecture)
- [Event Listener](#event-listener)
- [Event Handlers](#event-handlers)
- [Job Queue](#job-queue)
- [Webhook System](#webhook-system)
- [Push Notifications](#push-notifications)
- [Cron Jobs](#cron-jobs)

---

## Event System Architecture

```mermaid
graph TB
    subgraph Sources["Event Sources"]
        CHAIN["Solana Program<br/>On-chain events"]
        API_EVENTS["API Actions<br/>User actions"]
        CRON["Cron Jobs<br/>Scheduled tasks"]
    end

    subgraph Processing["Event Processing Pipeline"]
        LISTENER["Event Listener<br/>backend/events/event-listener.ts"]
        HANDLERS["Event Handlers<br/>backend/events/handlers.ts"]
        QUEUE["Job Queue<br/>backend/queue/queue-service.ts"]
    end

    subgraph Delivery["Delivery Channels"]
        WEBHOOK_D["Webhook Delivery<br/>backend/queue/webhook.ts"]
        PUSH_D["Push Notifications<br/>Web Push API"]
        DB_LOG["Event Logs<br/>event_logs table"]
    end

    CHAIN --> LISTENER
    API_EVENTS --> HANDLERS
    CRON --> QUEUE
    LISTENER --> HANDLERS
    HANDLERS --> QUEUE
    HANDLERS --> DB_LOG
    QUEUE --> WEBHOOK_D
    QUEUE --> PUSH_D
```

---

## Event Listener

### On-Chain Event Polling

```mermaid
sequenceDiagram
    participant Listener as Event Listener
    participant RPC as Solana RPC
    participant DB as PostgreSQL
    participant Handlers as Event Handlers

    loop Polling Cycle
        Listener->>RPC: getSignaturesForAddress(programId, since: lastSlot)
        RPC-->>Listener: Transaction signatures
        
        loop Each Transaction
            Listener->>RPC: getParsedTransaction(signature)
            RPC-->>Listener: Transaction data + logs
            Listener->>Listener: Parse program events from logs
            Listener->>DB: Insert event_log (processed: false)
            Listener->>Handlers: Route event by type
        end
    end
```

### Event Types

| Event Type | Source | Description |
|---|---|---|
| `enrollment_created` | On-chain | New course enrollment |
| `lesson_completed` | On-chain | Lesson marked complete |
| `course_finalized` | On-chain | All lessons completed |
| `credential_issued` | On-chain | NFT credential minted |
| `credential_upgraded` | On-chain | Credential metadata updated |
| `achievement_awarded` | On-chain | Achievement NFT minted |
| `xp_rewarded` | On-chain | XP tokens minted (streak, etc.) |
| `course_created` | On-chain | New course created |

---

## Event Handlers

### Handler Routing

```mermaid
flowchart TD
    EVENT[Incoming Event] --> TYPE{Event Type?}
    
    TYPE -->|enrollment_created| H1[Handle Enrollment]
    TYPE -->|lesson_completed| H2[Handle Lesson Completion]
    TYPE -->|course_finalized| H3[Handle Course Finalization]
    TYPE -->|credential_issued| H4[Handle Credential Issue]
    TYPE -->|achievement_awarded| H5[Handle Achievement Award]
    TYPE -->|xp_rewarded| H6[Handle XP Reward]

    H1 --> UPD_DB[Update Database Records]
    H2 --> UPD_DB
    H2 --> CHECK_ACH[Check Achievement Criteria]
    H3 --> UPD_DB
    H3 --> CHECK_ACH
    H4 --> UPD_DB
    H5 --> UPD_DB
    H6 --> UPD_DB

    UPD_DB --> ENQUEUE[Enqueue Notification Jobs]
    CHECK_ACH --> ENQUEUE
    ENQUEUE --> MARK[Mark event_log as processed]
```

---

## Job Queue

### Queue Service Architecture

```mermaid
graph TB
    subgraph Queue["Queue Service"]
        ENQUEUE["enqueue(job)<br/>Add job to queue"]
        PROCESS["processQueue()<br/>Dequeue and execute"]
        RETRY_Q["Retry Logic<br/>Exponential backoff"]
    end

    subgraph JobTypes["Job Types"]
        J_WEBHOOK["WEBHOOK_DELIVERY<br/>HTTP POST to endpoint"]
        J_PUSH["PUSH_NOTIFICATION<br/>Web Push API delivery"]
        J_SYNC["XP_SNAPSHOT_SYNC<br/>Leaderboard data sync"]
    end

    subgraph Storage["Queue Storage"]
        REDIS_Q["Redis List<br/>FIFO queue"]
    end

    Queue --> JobTypes
    Queue --> Storage
```

### Job Type Definitions

| Job Type | Payload | Delivery | Retry |
|---|---|---|---|
| `WEBHOOK_DELIVERY` | event data + webhook config | HTTP POST | 3 retries, exponential backoff |
| `PUSH_NOTIFICATION` | title, body, user_id | Web Push API | 2 retries |
| `XP_SNAPSHOT_SYNC` | wallet list | Database write | 3 retries |

---

## Webhook System

### Webhook Delivery Flow

```mermaid
sequenceDiagram
    participant Queue as Job Queue
    participant Webhook as Webhook Service
    participant DB as PostgreSQL
    participant Endpoint as External Endpoint

    Queue->>Webhook: Process WEBHOOK_DELIVERY job
    Webhook->>DB: Get active webhook_configs matching event type
    
    loop Each Webhook Config
        Webhook->>Webhook: Build payload with event data
        Webhook->>Webhook: Sign payload with webhook secret (HMAC-SHA256)
        Webhook->>Endpoint: POST {url} with signed payload
        
        alt Success (2xx)
            Endpoint-->>Webhook: 200 OK
            Webhook->>DB: Log successful delivery
        else Failure
            Endpoint-->>Webhook: Error/timeout
            Webhook->>Queue: Re-enqueue with backoff
        end
    end
```

### Webhook Configuration

| Field | Type | Description |
|---|---|---|
| `url` | String | Delivery endpoint URL |
| `secret` | String | HMAC signing secret |
| `events` | String[] | Subscribed event types |
| `active` | Boolean | Enable/disable toggle |
| `created_by` | UUID | Creator profile reference |

### Webhook Payload Format

```json
{
    "event": "lesson_completed",
    "timestamp": "2026-03-03T10:00:00Z",
    "data": {
        "userId": "uuid",
        "courseId": "string",
        "lessonIndex": 5,
        "xpEarned": 100,
        "txHash": "solana-tx-signature"
    },
    "signature": "hmac-sha256-signature"
}
```

---

## Push Notifications

### Push Subscription Flow

```mermaid
sequenceDiagram
    participant Browser
    participant SW as Service Worker
    participant API as Notification API
    participant DB as PostgreSQL

    Browser->>Browser: Request notification permission
    Browser->>SW: Subscribe to push (VAPID key)
    SW-->>Browser: PushSubscription object
    
    Browser->>API: POST /api/notifications/subscribe
    Note over API: { endpoint, p256dh, auth }
    API->>DB: Insert push_subscriptions
    API-->>Browser: Subscription registered

    Note over API,Browser: Later, when notification is triggered
    API->>SW: Web Push (encrypted payload)
    SW->>Browser: Show notification
```

### Push Subscription Schema

| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | User who subscribed |
| `endpoint` | String (unique) | Push API endpoint URL |
| `p256dh` | String | Client public key |
| `auth` | String | Client auth secret |

---

## Cron Jobs

### Scheduled Tasks

```mermaid
graph LR
    subgraph Cron["Cron Jobs"]
        SYNC["sync-xp-snapshots<br/>POST /api/cron/sync-xp-snapshots"]
    end

    subgraph Actions["Actions"]
        QUERY_H["Query Helius for XP holders"]
        SNAPSHOT["Write xp_snapshots table"]
        CLEAN["Clean old snapshots"]
    end

    Cron --> Actions
```

### XP Snapshot Sync

| Parameter | Value |
|---|---|
| Endpoint | `POST /api/cron/sync-xp-snapshots` |
| Schedule | Configurable (e.g., every 6 hours) |
| Auth | Cron secret header |
| Purpose | Enables time-windowed leaderboard queries |

```mermaid
sequenceDiagram
    participant Cron as Cron Trigger
    participant API as Sync API
    participant Helius as Helius DAS
    participant DB as PostgreSQL

    Cron->>API: POST /api/cron/sync-xp-snapshots
    API->>Helius: getXpTokenHolders(xpMint)
    Helius-->>API: Token holder list with amounts
    
    loop Each Holder
        API->>DB: INSERT xp_snapshots (wallet, xp_balance, snapped_at)
    end
    
    API-->>Cron: Sync complete ({ count: N })
```
