# CMS Guide

## Overview

Superteam Academy uses Sanity.io as its headless CMS for managing course content, lessons, and learning materials. This guide covers the content schema, publishing workflow, and best practices for content editors.

---

## Sanity Studio

**Access**: https://superteam-academy.sanity.studio

### Environment Variables Required

```bash
# .env.local
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_write_token  # For content creation
```

---

## Content Schema

### Course
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Course title (max 100 chars) |
| `slug` | slug | URL-friendly identifier |
| `description` | text | Course overview (max 500 chars) |
| `difficulty` | string | "beginner" / "intermediate" / "advanced" |
| `category` | string | Track category (Solana, Anchor, DeFi, etc.) |
| `image` | image | Course thumbnail (16:9 aspect ratio) |
| `modules` | array | Ordered list of Module references |
| `xpReward` | number | Total XP for completing course |
| `isPublished` | boolean | Draft/Published state |
| `orderIndex` | number | Sort order on courses page |

### Module
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Module title |
| `description` | text | Brief module overview |
| `lessons` | array | Ordered list of Lesson references |
| `orderIndex` | number | Module order within course |

### Lesson
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Lesson title |
| `slug` | slug | URL-friendly identifier |
| `type` | string | "reading" / "coding" / "quiz" |
| `content` | portable text | Main lesson content (markdown-like) |
| `starterCode` | code | Initial code for coding challenges |
| `testCases` | array | Test cases for code validation |
| `xpReward` | number | XP awarded on completion |
| `orderIndex` | number | Lesson order within module |

### Achievement
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Achievement name |
| `description` | string | How to earn it |
| `icon` | string | Emoji or icon identifier |
| `rarity` | string | "common" / "rare" / "epic" / "legendary" |
| `xpReward` | number | Bonus XP for earning |

---

## Creating a Course

### Step 1: Create Course Document

1. Navigate to **Course** in Sanity Studio sidebar
2. Click **Create** → **New Course**
3. Fill in required fields:
   - `title`: "Solana Fundamentals"
   - `slug`: auto-generated from title
   - `description`: Brief course overview
   - `difficulty`: Select appropriate level
   - `category`: e.g., "Solana", "Anchor", "DeFi"
   - `xpReward`: Total XP (e.g., 1200)

### Step 2: Create Modules

1. With course open, click **Add** next to Modules
2. Create new Module document
3. Fill in:
   - `title`: e.g., "Introduction to Solana"
   - `description`: What students learn
   - `orderIndex`: 0 for first module

### Step 3: Create Lessons

1. Within a Module, click **Add** next to Lessons
2. Create Lesson document
3. Configure based on type:

**Reading Lesson:**
- Set `type`: "reading"
- Write content in Portable Text editor
- Add `xpReward`: e.g., 50

**Coding Challenge:**
- Set `type`: "coding"
- Write instructions in `content`
- Add `starterCode`: Initial code template
- Add `testCases`: Array of test objects:
  ```json
  {
    "input": "hello",
    "expectedOutput": "hello",
    "description": "Should return input unchanged"
  }
  ```

### Step 4: Publish

1. Click **Publish** in document actions
2. Content immediately available via API
3. Next.js ISR refreshes in ~60 seconds

---

## Publishing Workflow

### Content States

```
Draft → In Review → Published
                ↘ → Archived
```

### Best Practices

1. **Preview First**: Use Sanity's preview pane to verify content
2. **Test Links**: Ensure all internal links work
3. **Validate Code**: Test code snippets in playground
4. **Version Control**: Keep significant changes documented

### API Integration

Content is fetched via Sanity's GROQ queries:

```typescript
// Fetch all published courses
const query = `*[_type == "course" && isPublished == true] | order(orderIndex) {
  _id, title, slug, description, difficulty, category, xpReward,
  "modules": modules[]->{title, "lessons": lessons[]->{title, type, xpReward}}
}`;
```

---

## Supabase Tables (Secondary Content)

For user-generated content and gamification:

| Table | Purpose |
|-------|---------|
| `user_profiles` | Wallet addresses, XP, levels |
| `xp_transactions` | XP gain history |
| `achievements` | Earned badges |
| `enrollments` | Course progress |
| `quiz_questions` | Practice quiz bank |
| `quiz_attempts` | Quiz attempt history |

---

## Troubleshooting

### Content Not Appearing
- Verify `isPublished` is `true`
- Check course has at least one module with lessons
- Wait for ISR cache refresh (60s)

### Build Errors
- Ensure all referenced documents exist
- Check for circular references
- Validate image assets are uploaded

### API Errors
- Verify Sanity project ID in environment
- Check API token permissions
- Review CORS settings in Sanity dashboard
