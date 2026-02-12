# CMS Guide — Superteam Academy

How to create and manage courses with the Headless CMS. The platform expects **courses → modules → lessons**; each lesson is either **content** (reading/video) or **challenge** (interactive coding).

---

## Content model

### Course

- **Slug** (id): unique URL segment (e.g. `solana-fundamentals`)
- **Title**, **Description**: display text
- **Difficulty**: beginner | intermediate | advanced
- **Duration**: e.g. "6h", "4 weeks"
- **XP total**: total XP earnable (e.g. 500–2000)
- **Track**: optional track ID for credential association (e.g. Anchor, Rust, DeFi)
- **Thumbnail**: image URL
- **Instructor** (optional): name/avatar
- **Status**: draft | published

### Module

- **Title**: e.g. "Module 1: Introduction"
- **Order**: sort order within course
- **Lessons**: list of lesson references

### Lesson

- **Type**: `content` | `challenge`
- **Title**: short label
- **Order**: within module
- **Content** (for type `content`): Markdown + code blocks, optional video URL
- **Challenge** (for type `challenge`): prompt, starter code, test cases (input/expected output), XP reward

---

## Schema example (Sanity)

```json
{
  "name": "course",
  "type": "document",
  "fields": [
    { "name": "slug", "type": "slug", "options": { "source": "title" } },
    { "name": "title", "type": "string" },
    { "name": "description", "type": "text" },
    { "name": "difficulty", "type": "string", "options": { "list": ["beginner", "intermediate", "advanced"] } },
    { "name": "duration", "type": "string" },
    { "name": "xpTotal", "type": "number" },
    { "name": "trackId", "type": "number" },
    { "name": "thumbnail", "type": "image" },
    { "name": "modules", "type": "array", "of": [{ "type": "module" }] }
  ]
}
```

Modules and lessons can be embedded or referenced; ensure order is preserved for lesson sequence.

---

## Publishing workflow

1. **Draft**: Create course and modules/lessons; save as draft.
2. **Review**: Content and metadata reviewed.
3. **Publish**: Set status to published; frontend fetches published courses only (by default).
4. **Update**: Edit and re-publish; versioning can be added later.

---

## Mock course

A mock course with sample content is provided for testing the catalog, course detail, and lesson views. Import or create it in your CMS and point the frontend API to the same project.

---

## Frontend integration

- Course catalog: fetch published courses; filter by difficulty, topic, duration; full-text search if supported by CMS.
- Course detail: fetch course by slug; resolve modules and lessons; show progress from `LearningProgressService.getProgress`.
- Lesson view: fetch lesson by course slug + lesson index; render Markdown; load challenge (starter code, tests) for code editor and pass/fail feedback.
