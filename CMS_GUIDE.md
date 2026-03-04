# CMS Guide (Sanity + Local Fallback)

## Goal
Manage course/module/lesson content in Sanity while preserving a reliable local JSON fallback for dev/demo and resilience.

## Content Sources
1. Local JSON (`src/content`) - always available fallback
2. Sanity dataset - primary when env is configured

Mode is auto-resolved by content service and can be inspected via:
- `GET /api/cms-status`

## Required Environment Variables
Set in `app/.env.local` and deployment env:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
SANITY_API_READ_TOKEN=   # required if dataset is private
```

## Schemas
- `app/src/sanity/schemaTypes/course.ts`
- `app/src/sanity/schemaTypes/lesson.ts`

Important lesson fields:
- `courseId`
- `lessonIndex`
- `title`, `description`, `xpReward`
- `content`, `starterCode`, `tests`
- optional `videoUrl`

## Seed Workflow
Generate seed from local content:
```bash
cd app
npm run cms:seed
```
Output file:
- `app/sanity-seed.ndjson`

Import to Sanity dataset:
```bash
sanity dataset import sanity-seed.ndjson production --replace
```

## Authoring Workflow
1. Edit/create `course` and `lesson` docs in Sanity Studio.
2. Keep drafts while reviewing.
3. Publish ready content.
4. Validate in app routes:
- `/{locale}/courses`
- `/{locale}/courses/[courseId]`
- `/{locale}/courses/[courseId]/lessons/[lessonIndex]`

## Validation Checklist
- [ ] `GET /api/cms-status` shows expected mode and counts
- [ ] Published lessons render correctly
- [ ] `videoUrl` lessons render embed/link behavior
- [ ] App still works when Sanity is unavailable (fallback path)

## Private Dataset Notes
If Sanity dataset is private and `SANITY_API_READ_TOKEN` is missing:
- reads can fail/return empty
- course list may appear incomplete

Always set `SANITY_API_READ_TOKEN` in production when dataset visibility is private.

## Troubleshooting
1. No courses showing:
- verify `NEXT_PUBLIC_SANITY_PROJECT_ID` and dataset
- verify dataset has published documents
- verify token for private datasets

2. Lesson 404 for on-chain course:
- ensure matching `courseId` content exists in Sanity/local pack
- verify lesson index exists for that course

3. Seed import project error:
- ensure Sanity CLI is logged in
- ensure projectId is configured in Sanity CLI context
