# Community Forum

## Table of Contents

- [Forum Architecture](#forum-architecture)
- [Data Model](#data-model)
- [Thread Management](#thread-management)
- [Reply System](#reply-system)
- [Upvote System](#upvote-system)
- [Moderation](#moderation)
- [API Endpoints](#api-endpoints)

---

## Forum Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend Components"]
        LIST["Thread List<br/>Filtered by category/course"]
        DETAIL["Thread Detail<br/>Replies + upvotes"]
        CREATE["Create Thread<br/>Rich text editor"]
        REPLY_UI["Reply Composer<br/>Markdown support"]
    end

    subgraph API_Layer["API Layer"]
        THREAD_API["Thread Endpoints (6)"]
        REPLY_API["Reply Endpoints (4)"]
    end

    subgraph Backend_Layer["Backend Services"]
        PRISMA_Q["Prisma Queries<br/>Pagination, filtering"]
        AUTH_CHECK["Auth + Rate Limit"]
        SANITIZE["Content Sanitization<br/>DOMPurify"]
    end

    subgraph Data["Database"]
        THREADS_TBL["threads"]
        REPLIES_TBL["replies"]
        T_UPVOTES["thread_upvotes"]
        R_UPVOTES["reply_upvotes"]
    end

    Frontend --> API_Layer
    API_Layer --> Backend_Layer
    Backend_Layer --> Data
```

---

## Data Model

```mermaid
erDiagram
    threads ||--o{ replies : "contains"
    threads ||--o{ thread_upvotes : "receives"
    replies ||--o{ reply_upvotes : "receives"
    profiles ||--o{ threads : "authors"
    profiles ||--o{ replies : "writes"
    profiles ||--o{ thread_upvotes : "casts"
    profiles ||--o{ reply_upvotes : "casts"

    threads {
        uuid id PK
        string title
        text content
        uuid author_id FK
        string category
        string course_id
        string lesson_id
        string_array tags
        int upvotes
        int reply_count
        boolean is_pinned
        boolean is_locked
    }

    replies {
        uuid id PK
        uuid thread_id FK
        text content
        uuid author_id FK
        int upvotes
        boolean is_accepted
    }
```

### Thread Categories

| Category | Description | Context |
|---|---|---|
| `general` | General discussion | Platform-wide |
| `help` | Help requests | Platform-wide |
| `course` | Course-specific discussion | Linked to `course_id` |
| `lesson` | Lesson-specific questions | Linked to `course_id` + `lesson_id` |
| `showcase` | Project showcases | Platform-wide |
| `feedback` | Platform feedback | Platform-wide |

---

## Thread Management

### Thread Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: User composes
    Draft --> Open: POST /api/community/threads
    Open --> Open: Receives replies, upvotes
    Open --> Locked: Admin locks
    Open --> Pinned: Admin pins
    Open --> Deleted: Author/Admin deletes
    Locked --> Open: Admin unlocks
    Pinned --> Open: Admin unpins
    Deleted --> [*]

    state Open {
        [*] --> Active
        Active --> HasAccepted: Reply accepted
    }
```

### Thread Operations

| Operation | Who Can | Endpoint | Method |
|---|---|---|---|
| Create thread | Any authenticated user | `/api/community/threads` | POST |
| Edit thread | Author only | `/api/community/threads/{id}` | PUT |
| Delete thread | Author or Admin | `/api/community/threads/{id}` | DELETE |
| Pin/Unpin | Admin only | `/api/admin/community/moderate` | POST |
| Lock/Unlock | Admin only | `/api/admin/community/moderate` | POST |

---

## Reply System

```mermaid
sequenceDiagram
    participant User
    participant API as Community API
    participant DB as PostgreSQL

    User->>API: POST /api/community/threads/{id}/replies
    API->>API: Verify authenticated session
    API->>API: Sanitize content (DOMPurify)
    API->>DB: Check thread exists and not locked
    API->>DB: Insert reply
    API->>DB: Increment thread.reply_count
    API-->>User: Reply created

    Note over User,DB: Accept Answer Flow
    User->>API: POST /api/community/replies/{replyId}/accept
    API->>DB: Verify user is thread author
    API->>DB: Set reply.is_accepted = true
    API-->>User: Answer accepted
```

---

## Upvote System

### Toggle Upvote Pattern

```mermaid
flowchart TD
    A[POST .../upvote] --> B{Existing vote?}
    B -->|No| C[Insert upvote record]
    B -->|Yes| D[Delete upvote record]
    C --> E[Increment upvotes count]
    D --> F[Decrement upvotes count]
    E --> G[Return updated count]
    F --> G

    Note1["Unique constraint: (thread_id, user_id)<br/>prevents double voting"]
```

---

## Moderation

### Admin Moderation Capabilities

```mermaid
graph TB
    subgraph Moderation["Content Moderation"]
        PIN["Pin/Unpin Thread"]
        LOCK["Lock/Unlock Thread"]
        DELETE_T["Delete Thread"]
        DELETE_R["Delete Reply"]
    end

    subgraph Access["Access Control"]
        ADMIN_ROLE["Admin Role Required"]
        CSRF["CSRF Protection"]
        RATE_STRICT["Strict Rate Limit"]
    end

    Access --> Moderation
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/community/threads` | None | List threads (paginated, filtered by category/course) |
| POST | `/api/community/threads` | JWT | Create thread |
| GET | `/api/community/threads/{id}` | None | Get thread with author details |
| PUT | `/api/community/threads/{id}` | JWT | Update thread (author only) |
| DELETE | `/api/community/threads/{id}` | JWT | Delete thread (author/admin) |
| POST | `/api/community/threads/{id}/upvote` | JWT | Toggle upvote |
| GET | `/api/community/threads/{id}/replies` | None | List replies (paginated) |
| POST | `/api/community/threads/{id}/replies` | JWT | Post reply |
| PUT | `/api/community/replies/{replyId}` | JWT | Edit reply (author only) |
| DELETE | `/api/community/replies/{replyId}` | JWT | Delete reply (author/admin) |
| POST | `/api/community/replies/{replyId}/upvote` | JWT | Toggle reply upvote |
| POST | `/api/community/replies/{replyId}/accept` | JWT | Accept answer (thread author) |
| POST | `/api/admin/community/moderate` | Admin | Pin/lock/moderate threads |
