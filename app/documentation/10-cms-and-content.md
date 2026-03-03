# CMS and Content Management

## Table of Contents

- [CMS Architecture](#cms-architecture)
- [Sanity Configuration](#sanity-configuration)
- [Content Schemas](#content-schemas)
- [Content Pipeline](#content-pipeline)
- [CMS API Integration](#cms-api-integration)
- [Content Delivery](#content-delivery)

---

## CMS Architecture

```mermaid
graph TB
    subgraph Studio["Sanity Studio"]
        EDITOR_UI["Content Editor<br/>sanity.config.ts"]
        SCHEMAS["6 Content Schemas<br/>sanity/schemas/"]
    end

    subgraph SanityCloud["Sanity Cloud"]
        CDN["Content CDN<br/>Global edge delivery"]
        ASSETS["Asset Pipeline<br/>Image optimization"]
        GROQ["GROQ Query Engine<br/>Structured content queries"]
    end

    subgraph Application["Next.js Application"]
        CLIENT["@sanity/client<br/>Server-side queries"]
        IMAGE["@sanity/image-url<br/>Responsive images"]
        PREVIEW["Preview Mode<br/>Draft content viewing"]
        CMS_API["GET /api/cms/course<br/>Content endpoint"]
    end

    subgraph Pages["Frontend Pages"]
        CATALOG["Course Catalog<br/>Titles, descriptions"]
        DETAIL["Course Detail<br/>Lessons, media"]
        LESSON_P["Lesson View<br/>Instructions, code"]
    end

    Studio --> SanityCloud
    SanityCloud --> Application
    Application --> Pages
```

---

## Sanity Configuration

### Project Configuration

| Setting | Value |
|---|---|
| Config file | `sanity.config.ts` |
| CLI config | `sanity.cli.ts` |
| Project ID | `SANITY_PROJECT_ID` env var |
| Dataset | `production` (configurable) |
| API Version | Latest |
| Plugins | `sanity-plugin-markdown`, `@sanity/code-input` |

### Schema Directory

```
sanity/
  schemas/         # 6 content type schemas
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SANITY_PROJECT_ID` | Yes | Sanity project identifier |
| `SANITY_DATASET` | Yes | Dataset name (production) |
| `SANITY_API_TOKEN` | Yes | API token for server queries |
| `SANITY_PREVIEW_SECRET` | No | Secret for preview mode |

---

## Content Schemas

### Course Content Model

```mermaid
classDiagram
    class Course_CMS {
        +string title
        +slug slug
        +text description
        +image thumbnail
        +string difficulty
        +number trackId
        +string onChainCourseId
        +Lesson[] lessons
        +string[] tags
        +reference author
    }

    class Lesson {
        +string title
        +slug slug
        +number order
        +markdown content
        +CodeBlock[] codeBlocks
        +string instructions
        +string expectedOutput
        +string language
    }

    class CodeBlock {
        +string language
        +string code
        +string filename
        +boolean editable
    }

    Course_CMS --> Lesson : contains
    Lesson --> CodeBlock : includes
```

### Content Types

| Schema | Purpose | Key Fields |
|---|---|---|
| Course | Course definition and metadata | title, slug, description, lessons, trackId |
| Lesson | Individual lesson content | title, content (markdown), code blocks, order |
| Author | Course creator profile | name, bio, avatar, social links |
| Category | Course categorization | name, slug, description |
| Challenge | Daily challenge definitions | title, description, type, reward |
| Announcement | Platform announcements | title, body, priority, expiry |

---

## Content Pipeline

### Content Creation to Display

```mermaid
sequenceDiagram
    participant Instructor
    participant Studio as Sanity Studio
    participant CDN as Sanity CDN
    participant API as Next.js API
    participant Frontend

    Instructor->>Studio: Create/edit course content
    Studio->>CDN: Publish content

    Frontend->>API: GET /api/cms/course?slug=intro-to-anchor
    API->>CDN: GROQ query for course + lessons
    CDN-->>API: Structured content + image URLs
    API->>API: Transform for frontend consumption
    API-->>Frontend: Course content with lessons

    Note over Frontend: Combines CMS content with on-chain data
    Frontend->>Frontend: Merge CMS lesson content with<br/>on-chain enrollment progress
```

### Content Caching Strategy

| Content Type | Cache Strategy | TTL |
|---|---|---|
| Course metadata | CDN + Next.js cache | 60 seconds |
| Lesson content | CDN + on-demand | 60 seconds |
| Images | Sanity CDN | Long-lived |
| Draft content | No cache (preview mode) | Real-time |

---

## CMS API Integration

### Backend CMS Service

```mermaid
graph LR
    subgraph Service["backend/cms/"]
        CMS_SVC["CMS Service<br/>GROQ queries"]
    end

    subgraph Queries["Query Types"]
        Q1["fetchCourse(slug)"]
        Q2["fetchAllCourses()"]
        Q3["fetchLesson(courseSlug, lessonSlug)"]
        Q4["fetchCategories()"]
    end

    subgraph Client["@sanity/client"]
        SANITY_CLIENT["createClient({<br/>projectId, dataset, apiVersion,<br/>token, useCdn<br/>})"]
    end

    Service --> Queries --> Client
```

---

## Content Delivery

### On-Chain + CMS Content Merge

```mermaid
graph TB
    subgraph OnChain["On-Chain Data"]
        COURSE_CHAIN["Course PDA<br/>courseId, lessonCount,<br/>xpPerLesson, difficulty"]
        ENROLLMENT_CHAIN["Enrollment PDA<br/>lessonFlags bitmap,<br/>completedAt"]
    end

    subgraph CMS_Data["CMS Data"]
        COURSE_CMS_D["Course Content<br/>title, description,<br/>thumbnail, lessons"]
        LESSON_CMS["Lesson Content<br/>instructions, code blocks,<br/>expected output"]
    end

    subgraph Merged["Merged View (Frontend)"]
        COURSE_VIEW["Course Detail Page<br/>On-chain stats + CMS content"]
        LESSON_VIEW["Lesson Page<br/>CMS content + progress bitmap"]
    end

    COURSE_CHAIN --> COURSE_VIEW
    COURSE_CMS_D --> COURSE_VIEW
    ENROLLMENT_CHAIN --> LESSON_VIEW
    LESSON_CMS --> LESSON_VIEW
```

| Data Field | Source | Description |
|---|---|---|
| Course title, description | Sanity CMS | Rich-formatted content |
| Course thumbnail | Sanity CDN | Optimized images |
| Lesson content, code blocks | Sanity CMS | Markdown + code snippets |
| Lesson count, XP per lesson | On-chain | Immutable program data |
| Enrollment status | On-chain | PDA account state |
| Lesson completion progress | On-chain | Bitmap in Enrollment PDA |
| Total enrollments/completions | On-chain | Course PDA counters |
