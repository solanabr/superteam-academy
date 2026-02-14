# CMS Guide — Superteam Academy

## Overview
Courses are managed in Sanity Studio. No code changes needed to create or edit courses.

## Content Hierarchy
```
Course
  └── Module (ordered)
       └── Lesson (ordered)
            ├── Type: "content" (reading/video)
            └── Type: "challenge" (interactive coding)
```

## Creating a Course

### 1. Course Document
- **Title**: Course name (e.g., "Solana Fundamentals")
- **Slug**: URL-friendly ID (auto-generated from title)
- **Description**: 1-2 paragraph overview
- **Difficulty**: beginner | intermediate | advanced
- **Duration**: Estimated hours (e.g., "8 hours")
- **XP Reward**: Total XP for completion (500-2000)
- **Track**: Learning track association (e.g., "DeFi Developer")
- **Thumbnail**: Course card image (recommended 800x450)
- **Tags**: Searchable tags (e.g., ["rust", "anchor", "smart-contracts"])

### 2. Module Document
- **Title**: Module name (e.g., "Setting Up Your Environment")
- **Course**: Reference to parent course
- **Order**: Display order within course (1, 2, 3...)
- **Description**: Brief module overview

### 3. Lesson Document (Content Type)
- **Title**: Lesson name
- **Module**: Reference to parent module
- **Order**: Display order within module
- **Type**: "content"
- **Body**: Rich text with:
  - Markdown formatting
  - Code blocks with syntax highlighting (specify language)
  - Images and videos (uploaded or embedded)
  - Callout boxes (tip, warning, info)
- **XP Reward**: XP for completing this lesson (10-50)
- **Estimated Time**: Minutes to complete

### 4. Lesson Document (Challenge Type)
- **Title**: Challenge name
- **Module**: Reference to parent module
- **Order**: Display order within module
- **Type**: "challenge"
- **Prompt**: Challenge description and objectives
- **Starter Code**: Pre-populated code in editor
- **Solution**: Hidden solution (toggle-able by learner)
- **Hints**: Array of expandable hints
- **Test Cases**: Array of { input, expectedOutput, description }
- **Language**: "rust" | "typescript" | "json"
- **XP Reward**: XP for completing (25-100)

## Publishing Workflow
1. Create content in **Draft** state
2. Preview in Sanity Studio
3. When ready, click **Publish**
4. Content appears on site immediately (ISR revalidation)

## Media Management
- Upload images directly in Sanity
- Sanity CDN handles optimization and responsive sizing
- Videos: embed YouTube/Vimeo links or upload directly

## Tips
- Keep lessons under 15 minutes of reading time
- One concept per lesson
- Every module should end with a challenge
- Use code blocks liberally with correct language tags
- Add hints to challenges (3 hints recommended)
