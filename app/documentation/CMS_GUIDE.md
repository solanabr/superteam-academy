# CMS Guide (Sanity)

This guide covers **how to create/edit courses**, the **current content schema**, and the **publishing workflow** used by this project.

## Studio Access

- Studio route: `/admin-premium/studio`
- Studio mount page: [app/src/app/admin-premium/studio/[[...tool]]/page.tsx](../app/src/app/admin-premium/studio/[[...tool]]/page.tsx)
- Studio config: [app/sanity.config.ts](../app/sanity.config.ts)
- Studio structure config: [app/src/sanity/structure.ts](../app/src/sanity/structure.ts)

## CMS Navigation Structure

The Studio content tree is organized as:

1. **Learning Content**
   - Tracks
   - Courses
   - Lessons
2. **Instructors**
3. **Achievements**

## Content Schema (Current Implementation)

Schema registry: [app/src/sanity/schemaTypes/index.ts](../app/src/sanity/schemaTypes/index.ts)

Active document types:

- `track` → [app/src/sanity/schemaTypes/track.ts](../app/src/sanity/schemaTypes/track.ts)
- `instructor` → [app/src/sanity/schemaTypes/instructor.ts](../app/src/sanity/schemaTypes/instructor.ts)
- `course` → [app/src/sanity/schemaTypes/course.ts](../app/src/sanity/schemaTypes/course.ts)
- `lesson` → [app/src/sanity/schemaTypes/lesson.ts](../app/src/sanity/schemaTypes/lesson.ts)
- `achievement` → [app/src/sanity/schemaTypes/achievement.ts](../app/src/sanity/schemaTypes/achievement.ts)

### Important modeling note

There is **no standalone `module` document type**.

`course.modules` is an **embedded array of objects** containing:

- `title`
- `description`
- `order`
- `lessons` (array of references to `lesson` documents)

So modules are managed inside the course document, while lessons are managed as separate documents and linked back into each module.

---

## How to Create a Course (End-to-End)

## Step 1 — Create dependencies first

Before creating a course, make sure these exist:

1. A `track` document (if needed)
2. An `instructor` document (if needed)
3. The `lesson` documents you plan to reference

## Step 2 — Create the course document

In **Learning Content → Courses**:

1. Create a new Course document
2. Fill required core fields:
   - `title` (required)
   - `slug` (required)
3. Fill recommended metadata:
   - `description`
   - `thumbnail`
   - `track` (reference)
   - `instructor` (reference)
   - `difficulty` (`beginner` | `intermediate` | `advanced`)
   - `duration`
   - `xpReward`
   - `prerequisites` (course refs)
   - `learningObjectives`
   - `tags`

## Step 3 — Build modules in the course

In `course.modules`:

1. Add module objects in intended sequence
2. For each module, set:
   - `title`
   - `description`
   - `order`
3. Add `lessons` references for each module in order

## Step 4 — Publish workflow for a new course

Publish in dependency order to avoid broken references in UI:

1. Publish referenced `track` and `instructor` (if newly created)
2. Publish all referenced `lesson` documents
3. Publish the `course` document

---

## How to Create/Edit Lessons

In **Learning Content → Lessons**:

### Core fields

- `title` (required)
- `slug` (required)
- `course` reference (required)
- `module` (string module key)
- `type` (required): `video | reading | challenge | quiz | interactive`
- `duration`, `xpReward`, `order`

### Content fields

- `content` (Portable Text + code blocks + images)
- `hints` (array of strings)

### Conditional type-specific fields

- Video lessons:
  - `videoUrl`
  - `videoProvider`
- Challenge lessons:
  - `challenge.instructions`
  - `challenge.starterCode`
  - `challenge.solutionCode`
  - `challenge.language`
  - `challenge.testCases[]`
- Quiz lessons:
  - `quiz.question`
  - `quiz.options[]`
  - `quiz.xpReward`

After creating or editing lessons, re-open the related course and verify module lesson references are correct.

---

## How to Edit Existing Courses Safely

For updates to live courses:

1. Edit in draft first
2. Avoid changing `slug` unless route migration is planned
3. Keep `modules[].order` and lesson reference ordering stable
4. If replacing lessons, publish new lessons first, then update module references
5. Re-publish course

For high-risk edits (major reorder, slug changes), perform a QA check in app routes before broad release.

---

## Publishing Workflow

Sanity has two relevant publish controls in this project:

1. **Sanity document publish action** (draft → published)
2. **`course.published` boolean field** used by app-side filtering logic in some flows

### Recommended publish process

1. Save all changes as drafts
2. Publish dependent docs first (`track` / `instructor` / `lesson`)
3. Publish `course`
4. Set `course.published = true` when course should be visible to users
5. Validate in app pages (catalog, course detail, lesson pages)

### Unpublish process

1. Set `course.published = false` to remove from user-facing lists where this flag is enforced
2. Optionally unpublish Sanity document if complete removal is required

---

## Environment Variables

Required for Studio + Sanity client:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-02-23
SANITY_API_TOKEN=
```

Sanity env helper: [app/src/sanity/env.ts](../app/src/sanity/env.ts)

---

## Integration Points in App

Sanity clients/helpers:

- [app/src/sanity/lib/client.ts](../app/src/sanity/lib/client.ts)
- [app/src/lib/sanity/client.ts](../app/src/lib/sanity/client.ts)

Consumers:

- marketing and discovery pages under [app/src/app/(marketing)](<../app/src/app/(marketing)>)
- dashboard course pages under [app/src/app/(dashboard)/courses](<../app/src/app/(dashboard)/courses>)

---

## Troubleshooting

## Studio not loading

- Check `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`
- Check authenticated Sanity account permissions
- Confirm route is `/admin-premium/studio`

## Content updates not visible

- Confirm document is published (not draft-only)
- Confirm `course.published` is set to `true` where required
- Verify referenced lessons are published

## Broken lesson/module ordering

- Check `modules[].order`
- Check lesson reference order inside each module
- Check lesson `order` field consistency

## Slug/routing issues

- Avoid changing published slugs without redirect strategy
- Verify uniqueness of `course.slug` and `lesson.slug`

---

## Release Checklist (Course Content)

Before releasing a course update:

- Track/instructor references valid
- Course metadata complete
- Module ordering validated
- Lesson references valid and published
- Challenge test cases verified
- `course.published = true` (if intended live)
- Course document published
- In-app QA done on catalog, course page, and lesson view
