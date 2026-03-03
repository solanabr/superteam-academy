# Admin Dashboard

## Table of Contents

- [Admin Architecture](#admin-architecture)
- [Access Control](#access-control)
- [Admin Features](#admin-features)
- [Whitelist Management](#whitelist-management)
- [User Management](#user-management)
- [Content Moderation](#content-moderation)
- [Platform Analytics](#platform-analytics)
- [API Endpoints](#api-endpoints)

---

## Admin Architecture

```mermaid
graph TB
    subgraph AdminUI["Admin Dashboard UI"]
        OVERVIEW["Overview Panel<br/>Platform statistics"]
        USER_MGMT["User Management<br/>List, search, edit roles"]
        COURSE_MGMT["Course Management<br/>Status, analytics"]
        COMM_MOD["Community Moderation<br/>Pin, lock, delete"]
        WEBHOOK_MGMT["Webhook Management<br/>Configure, monitor"]
        WL_MGMT["Whitelist Management<br/>Add/remove admins"]
    end

    subgraph AdminAPI["Admin API Layer"]
        STATS_API["GET /api/admin/stats"]
        USERS_API["GET/PUT /api/admin/users"]
        COURSES_API["GET/POST /api/admin/courses"]
        MOD_API["POST /api/admin/community/moderate"]
        WH_API["GET/POST /api/admin/webhooks"]
        WL_API["GET/POST/DELETE /api/admin/whitelist"]
        AUTH_API["GET /api/admin/authority"]
    end

    subgraph Guards["Security Layer"]
        SESSION["Session Verification"]
        ROLE_CHECK["Admin Role Check"]
        CSRF["CSRF Protection<br/>Origin header validation"]
        RATE_LIM["Strict Rate Limit<br/>5 req/hour"]
    end

    AdminUI --> Guards --> AdminAPI
```

---

## Access Control

### Admin Determination Flow

```mermaid
flowchart TD
    REQ[Admin API Request] --> AUTH{Valid Session?}
    AUTH -->|No| DENY[401 Unauthorized]
    AUTH -->|Yes| CSRF{Origin Header Valid?}
    CSRF -->|No| DENY2[403 CSRF Rejected]
    CSRF -->|Yes| ROLE{session.role == admin?}
    ROLE -->|Yes| ALLOW[Allow Access]
    ROLE -->|No| ENV{Wallet in ADMIN_WALLETS env?}
    ENV -->|Yes| PROMOTE[Set role = admin]
    ENV -->|No| DB{Wallet in admin_whitelist?}
    DB -->|Yes| PROMOTE
    DB -->|No| DENY3[403 Forbidden]
    PROMOTE --> ALLOW

    style DENY fill:#e74c3c,color:#fff
    style DENY2 fill:#e74c3c,color:#fff
    style DENY3 fill:#e74c3c,color:#fff
    style ALLOW fill:#27ae60,color:#fff
```

### CSRF Protection

Admin endpoints validate the `Origin` header against `NEXTAUTH_URL`:

| Check | Implementation |
|---|---|
| Origin validation | `req.headers.get('origin')` must match `NEXTAUTH_URL` |
| Environment | Only enforced when `NEXTAUTH_URL` is set |
| Failure | Returns 403 with CSRF rejection message |

---

## Admin Features

### Overview Dashboard

| Metric | Source | Description |
|---|---|---|
| Total Users | Prisma query | All registered profiles |
| Active Users | Prisma query | Users with login in last 30 days |
| Total Courses | On-chain query | All courses on program |
| Total Enrollments | On-chain aggregate | Sum of course enrollments |
| Total Completions | On-chain aggregate | Sum of course completions |
| Total Threads | Prisma count | Forum thread count |
| Total Replies | Prisma count | Forum reply count |

---

## Whitelist Management

### Whitelist Operations

```mermaid
sequenceDiagram
    participant Admin
    participant API as Whitelist API
    participant DB as PostgreSQL

    Admin->>API: POST /api/admin/whitelist
    Note over API: { email?: string, wallet?: string }
    API->>API: Verify admin session + CSRF
    API->>API: Rate limit (strict: 5/hour)
    API->>DB: Check if entry already exists
    alt Already Exists
        API-->>Admin: 409 Conflict
    end
    API->>DB: Insert admin_whitelist (added_by: admin.id)
    API-->>Admin: 201 Created

    Admin->>API: DELETE /api/admin/whitelist/{id}
    API->>DB: Set removed_at = now() (soft delete)
    API-->>Admin: 200 OK
```

---

## User Management

### User Operations

| Operation | Method | Endpoint | Description |
|---|---|---|---|
| List users | GET | `/api/admin/users` | Paginated, searchable user list |
| Get user detail | GET | `/api/admin/users/{id}` | Full user profile with stats |
| Update user | PUT | `/api/admin/users/{id}` | Change role, status |

### Role Change Logging

All role changes are persisted in `role_change_log`:

```mermaid
sequenceDiagram
    participant Admin
    participant API as User API
    participant DB as PostgreSQL

    Admin->>API: PUT /api/admin/users/{id} { role: "instructor" }
    API->>DB: Get current profile
    API->>DB: Update profile.role
    API->>DB: Insert role_change_log
    Note over DB: profile_id, old_role, new_role,<br/>changed_by: admin.id, reason
    API-->>Admin: Updated profile
```

---

## Content Moderation

| Action | Target | Effect |
|---|---|---|
| Pin thread | Thread | Appears at top of listing |
| Unpin thread | Thread | Removes pinned status |
| Lock thread | Thread | Prevents new replies |
| Unlock thread | Thread | Re-enables replies |
| Delete thread | Thread | Cascades to replies and upvotes |
| Delete reply | Reply | Cascades to upvotes |

---

## Platform Analytics

```mermaid
graph LR
    subgraph Sources["Data Sources"]
        DB_DATA["PostgreSQL<br/>User, community data"]
        CHAIN_DATA["Solana<br/>Course, enrollment data"]
        POSTHOG_DATA["PostHog<br/>Behavior analytics"]
    end

    subgraph Metrics["Admin Metrics"]
        GROWTH["User Growth"]
        ENGAGEMENT["Engagement Rates"]
        COMPLETION["Completion Rates"]
        COMMUNITY_M["Community Activity"]
    end

    Sources --> Metrics
```

---

## API Endpoints

| Method | Endpoint | Rate Limit | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Strict | Platform-wide statistics |
| GET | `/api/admin/users` | Strict | User listing with pagination |
| GET | `/api/admin/users/{id}` | Strict | User detail |
| PUT | `/api/admin/users/{id}` | Strict | Update user role/status |
| GET | `/api/admin/courses` | Strict | Course management listing |
| POST | `/api/admin/courses` | Strict | Course operations |
| POST | `/api/admin/community/moderate` | Strict | Content moderation actions |
| GET | `/api/admin/webhooks` | Strict | List webhook configs |
| POST | `/api/admin/webhooks` | Strict | Create webhook config |
| GET | `/api/admin/whitelist` | Strict | List whitelist entries |
| POST | `/api/admin/whitelist` | Strict | Add whitelist entry |
| DELETE | `/api/admin/whitelist/{id}` | Strict | Remove whitelist entry |
| GET | `/api/admin/authority` | Strict | Program authority info |
