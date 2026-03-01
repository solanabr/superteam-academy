# CMS Content Guide — Superteam Academy

This guide explains how to manage course content through the Sanity CMS integration.

---

## Overview

Superteam Academy uses **Sanity CMS** to manage course content, lesson text, and media. The frontend fetches content from Sanity's CDN at build time (SSG) and on-demand (ISR). The on-chain program stores learner progress; Sanity stores the learning content.

**Sanity Studio URL:** [sanity.io/manage](https://www.sanity.io/manage) (log in with your project credentials)
**API Endpoint:** `https://cdn.sanity.io/v2021-06-07/data/query/<projectId>`

---

## Content Hierarchy

```
Course
└── Module (ordered list)
    └── Lesson (ordered list)
        ├── type: "content"   ← reading / video
        └── type: "challenge" ← interactive coding
```

### Course Schema

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display name (en/es/pt-BR) |
| `slug` | slug | URL path (e.g. `intro-solana`) |
| `description` | text | Short description (max 200 chars) |
| `track` | enum | `solana`, `defi`, `nft`, `anchor`, `security` |
| `level` | enum | `beginner`, `intermediate`, `advanced` |
| `imageUrl` | url | Course thumbnail (use Sanity CDN or external) |
| `xpReward` | number | XP granted on completion (typically 500–2000) |
| `published` | boolean | Draft / published toggle |

### Module Schema

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Module display name |
| `order` | number | Sort order within course |
| `lessons` | array | Ordered list of lesson references |

### Lesson Schema

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Lesson title |
| `type` | enum | `content` or `challenge` |
| `content` | portable text | Rich text with code blocks, images |
| `videoUrl` | url | Optional YouTube / Vimeo embed |
| `starterCode` | string | Code editor initial content (for challenges) |
| `solution` | string | Reference solution (hidden from learners) |
| `testCases` | array | Test inputs/outputs for challenge validation |
| `language` | enum | `rust`, `typescript`, `json` |
| `xpReward` | number | XP granted on completion (10–50) |

---

## Creating Your First Course

### Step 1: Set up Sanity environment

```bash
# Copy env template
cp app/.env.local.example app/.env.local

# Fill in these variables:
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_write_token  # from sanity.io/manage → API Tokens
```

### Step 2: Create a course in Sanity Studio

1. Log into [sanity.io/manage](https://www.sanity.io/manage)
2. Open your project → click **Studio**
3. Click **Course** → **+ New Course**
4. Fill in title (in all 3 languages), slug, track, level
5. Set `published: false` while building
6. Save

### Step 3: Add modules and lessons

1. With your course open, click **+ Add Module**
2. Give it a title and order number (0, 1, 2…)
3. Add lessons to each module
4. For **content lessons**: use the Portable Text editor — supports headings, code blocks (with syntax highlighting), images, embeds
5. For **challenge lessons**: set `starterCode`, `solution`, and at least 2 test cases

### Step 4: Publish

1. Toggle `published: true` on the course
2. Lessons inherit visibility from the course
3. The Next.js ISR cache refreshes within 60 seconds

---

## Draft/Publish Workflow

| Status | Visible in app | Indexed by Solana program |
|--------|----------------|---------------------------|
| `published: false` | No | No |
| `published: true` | Yes (5-min ISR cache) | After authority calls `create_course` |

**Two-step publish:**
1. Set `published: true` in Sanity → content appears in the catalog
2. Authority calls `create_course` instruction on-chain → learners can enroll and earn XP

This separation lets you preview content before it's enrollable.

---

## Multilingual Content

All text fields support locale objects. Use the locale switcher in Sanity Studio to enter translations:

```json
{
  "title": {
    "en": "Introduction to Solana",
    "es": "Introducción a Solana",
    "pt": "Introdução ao Solana"
  }
}
```

If a translation is missing, the frontend falls back to English.

---

## Media Management

- **Images**: Upload directly in Sanity Studio. They're served from `cdn.sanity.io` with automatic resizing.
- **Videos**: Embed YouTube/Vimeo URLs. The frontend renders them with lazy-loaded iframes.
- **Code snippets**: Use Portable Text's built-in code block (supports Rust, TypeScript, JSON, Bash, TOML).

Allowed image domains are configured in `next.config.ts`:
```ts
{ hostname: 'cdn.sanity.io', pathname: '/images/**' }
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | ✅ | Your Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | ✅ | Dataset name (default: `production`) |
| `SANITY_API_TOKEN` | For writes | Write token from sanity.io/manage |

Get your project ID from [sanity.io/manage](https://www.sanity.io/manage) → project settings.

---

## Fallback Behaviour (No CMS)

If Sanity is not configured (`NEXT_PUBLIC_SANITY_PROJECT_ID` not set), the app falls back to mock data defined in `app/lib/mock-data.ts`. This enables full development without a Sanity account.

---

## Adding a New Language

1. Add the locale code to `app/i18n/routing.ts`
2. Create `app/messages/<locale>.json` with translations (copy from `en.json`)
3. In Sanity, add the new locale to each content type's locale fields
4. Update `NEXT_PUBLIC_SUPPORTED_LOCALES` in `.env.local`
