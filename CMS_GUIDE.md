# CMS Guide

This project uses Sanity for course content authoring.

## Schema Files

- `sanity/schemas/course.ts`
- `sanity/schemas/module.ts`
- `sanity/schemas/lesson.ts`
- `sanity/schemas/index.ts`

## Content Model

### Course

Required course-facing metadata:

- title
- slug
- description
- difficulty
- duration
- XP total
- instructor
- topic/path
- module references

### Module

- belongs to one course
- has ordered lesson references

### Lesson

Supports both required lesson types:

- `content`
- `challenge`

Challenge-ready fields:

- markdown prompt/instructions
- starter code
- language (`rust`, `typescript`, `json`)
- visible test cases
- XP reward

## Authoring Workflow (Draft -> Publish)

1. Create a `course` in draft mode.
2. Create module documents and connect them to the course.
3. Create lesson documents and connect them to modules.
4. Validate metadata completeness (difficulty, duration, XP, path).
5. Publish lessons, then modules, then course.

## Sample Seed Content

- `sanity/sample-course.json`

Use this to bootstrap initial tracks such as `solana-fundamentals`.

## App Integration Path

- CMS client: `lib/cms/sanity-client.ts`
- Read model normalization: `lib/data/courses.ts`

To keep app compatibility:

1. Keep schema/query fields aligned.
2. Normalize CMS output to `CourseSummary`, `CourseDetail`, and `Lesson`.
3. Do not bypass `lib/data/courses.ts` from route pages.

## Operational Notes

- If `SANITY_PROJECT_ID` is missing, the app falls back gracefully instead of crashing.
- Keep lesson markdown concise for better editor/readability split in lesson workspace.
- Keep challenge test cases deterministic to avoid inconsistent pass/fail states.
