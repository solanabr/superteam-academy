# CMS Guide

## Overview

Solana Quest uses a headless CMS for managing course content. This guide explains the content schema, how to create/edit courses, and the publishing workflow.

## Content Schema

### Course

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `slug` | string | URL-friendly identifier |
| `title` | string | Course title |
| `description` | text | Full course description |
| `shortDescription` | string | Brief summary (1-2 sentences) |
| `thumbnail` | image | Course cover image |
| `difficulty` | enum | beginner, intermediate, advanced, legendary |
| `duration` | string | Estimated completion time |
| `totalXP` | number | Total XP available in course |
| `track` | reference | Learning track |
| `modules` | array[Module] | Course modules |
| `instructor` | reference | Course instructor |
| `tags` | array[string] | Search tags |
| `prerequisites` | array[reference] | Required courses |
| `language` | string | Content language |

### Module

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `title` | string | Module title |
| `description` | text | Module description |
| `order` | number | Sort order |
| `lessons` | array[Lesson] | Module lessons |
| `xpReward` | number | XP for completing module |

### Lesson

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `title` | string | Lesson title |
| `description` | text | Lesson description |
| `type` | enum | content, challenge, video, quiz |
| `order` | number | Sort order |
| `content` | rich text | Lesson content (Markdown) |
| `xpReward` | number | XP for completing lesson |
| `duration` | string | Estimated time |
| `challenge` | object | Code challenge (if type=challenge) |

### CodeChallenge

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Challenge title |
| `description` | text | Challenge description |
| `prompt` | text | What the learner needs to do |
| `starterCode` | code | Pre-populated code |
| `solution` | code | Reference solution |
| `language` | enum | rust, typescript, json |
| `testCases` | array | Test case definitions |
| `hints` | array[string] | Progressive hints |
| `difficulty` | enum | easy, medium, hard, boss |

## Creating a Course

### 1. Define the Course

Create a new course entry with:
- Clear, engaging title (RPG-themed: "The Genesis Quest", "The Forge", etc.)
- Compelling description explaining what learners will build
- Appropriate difficulty level
- Estimated duration
- XP budget (distribute across modules/lessons)
- Track association

### 2. Structure Modules

Each course should have 3-5 modules:
1. **Introduction** - Concepts and theory (content lessons)
2. **Hands-On** - Guided practice (mix of content and challenges)
3. **Deep Dive** - Advanced topics (content + harder challenges)
4. **Boss Battle** - Capstone project (boss difficulty challenge)

### 3. Create Lessons

For **content lessons**:
- Use Markdown with syntax-highlighted code blocks
- Include diagrams and visual explanations
- Add "Pro Tip" callouts for best practices
- Keep each lesson focused (10-20 min)

For **challenge lessons**:
- Write clear objectives and expected output
- Provide starter code that compiles
- Create 3-5 test cases (mix of visible and hidden)
- Add 2-3 progressive hints
- Include a reference solution
- Set appropriate XP reward based on difficulty

### 4. XP Budget Guide

| Lesson Type | XP Range |
|-------------|----------|
| Content (beginner) | 10-25 |
| Content (advanced) | 25-50 |
| Challenge (easy) | 25-50 |
| Challenge (medium) | 50-75 |
| Challenge (hard) | 75-100 |
| Challenge (boss) | 100-200 |
| Module completion bonus | 50-200 |
| Course completion bonus | 500-2000 |

## Publishing Workflow

### Draft → Review → Published

1. **Draft**: Create content in the CMS. Content is only visible to editors.
2. **Review**: Submit for review. Another editor validates content accuracy, code examples, and XP balance.
3. **Published**: Content goes live. Learners can access the course.

### Content Guidelines

- All code examples must compile and run
- Use TypeScript for frontend examples, Rust for on-chain examples
- Include comments in code explaining key concepts
- Test all challenge solutions against test cases
- Verify XP totals match the difficulty
- Ensure content works in all supported languages (or mark language-specific)

## Mock Data (Current)

Currently, course content is stored as TypeScript objects in `src/services/mock-data.ts`. When connecting a CMS:

1. Create the schema in your chosen CMS (Sanity, Strapi, Contentful)
2. Import the mock data as initial content
3. Update the `CourseService` implementation to fetch from the CMS API
4. The existing TypeScript types in `src/types/index.ts` define the exact shape

## Recommended CMS: Sanity

### Setup

```bash
npm create sanity@latest -- --project-id YOUR_ID --dataset production
```

### Schema Example

```typescript
// sanity/schemas/course.ts
export default {
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'difficulty', title: 'Difficulty', type: 'string', options: {
      list: ['beginner', 'intermediate', 'advanced', 'legendary']
    }},
    { name: 'track', title: 'Track', type: 'reference', to: [{ type: 'track' }] },
    { name: 'modules', title: 'Modules', type: 'array', of: [{ type: 'module' }] },
    // ... additional fields
  ]
}
```
