# CMS Guide — Superteam Academy (Sanity)

## Overview

Superteam Academy uses [Sanity.io](https://www.sanity.io/) as its headless CMS. Content is structured as **Courses → Modules → Lessons**, with optional **Game** references for interactive lesson types.

---

## Content Schema

### Course
| Field | Type | Description |
|---|---|---|
| `id` | Slug (auto) | Unique course ID |
| `slug` | Slug | URL-friendly name (auto from title) |
| `title` | String | Course title |
| `description` | Text | Full description |
| `shortDescription` | Text | One-liner for cards |
| `difficulty` | Enum | `beginner`, `intermediate`, `advanced`, `expert` |
| `track` | String | e.g. "Anchor", "DeFi", "Security" |
| `duration` | String | e.g. "8h" |
| `lessonCount` | Number | Total lessons |
| `xpReward` | Number | Total XP earned |
| `tags` | String[] | Searchable tags |
| `outcomes` | String[] | Learning outcomes |
| `prerequisites` | String[] | Prerequisites list |
| `instructor` | Reference | → Instructor document |
| `modules` | Reference[] | → Module documents (ordered) |

### Module
| Field | Type | Description |
|---|---|---|
| `title` | String | Module title |
| `lessons` | Reference[] | → Lesson documents (ordered) |

### Lesson
| Field | Type | Description |
|---|---|---|
| `id` | Slug (auto) | Unique lesson ID |
| `title` | String | Lesson title |
| `type` | Enum | `reading`, `code`, `quiz`, `video`, `game` |
| `duration` | String | e.g. "10min" |
| `xp` | Number | XP reward |
| `content` | Text | Markdown content |
| `game` | Reference | → Game document (only for `game` type) |

**Code Challenge Fields** (shown only when type = `code`):
- `language` — `typescript` or `rust`
- `initialCode` — Starter code template
- `solutionCode` — Correct solution
- `testCases` — Array of assertion strings
- `hints` — Array of hint strings

**Quiz Fields** (collapsible, any lesson type):
- `isRequired` — Must pass to complete
- `timerSeconds` — Countdown timer
- `xpReward` — Bonus XP
- `questions` — Array of `{ question, options[], correctOptionIndex, explanation }`

### Game
| Field | Type | Description |
|---|---|---|
| `gameId` | Slug (auto) | Unique external ID |
| `title` | String | Display name |
| `description` | Text | What it teaches |
| `engineType` | Enum | `scriblmotion`, `iframe`, `custom` |
| `embedUrl` | URL | For iframe games |
| `configJson` | Text | Engine config (ScriblMotion JSON, etc.) |
| `thumbnail` | Image | Preview image |
| `xpReward` | Number | XP on completion |
| `difficulty` | Enum | beginner/intermediate/advanced |
| `requiredScore` | Number | Min score (0–100) to pass |
| `tags` | String[] | Searchable tags |

### Instructor
| Field | Type | Description |
|---|---|---|
| `name` | String | Display name |
| `bio` | Text | Short bio |
| `avatar` | Image | Profile photo |

---

## Creating a Course

1. **Create an Instructor** — Go to "Instructors" → "Create" → Fill name, bio, avatar
2. **Create Lessons** — Go to "Lessons" → "Create" for each lesson
   - Set type (`reading`, `code`, `quiz`, `video`, or `game`)
   - Add content as Markdown
   - For code challenges: add initial code, solution, test cases
   - For games: select a Game reference
3. **Create Modules** — Go to "Modules" → "Create" → Add lesson references in order
4. **Create Course** — Go to "Courses" → "Create" → Fill metadata, add module references in order
5. **Publish** — Click "Publish" on each document (lessons → modules → course)

## Content Workflow

- **Draft** — Work in progress, not visible on the frontend
- **Published** — Live and visible to users
- Sanity supports real-time collaboration — multiple authors can edit simultaneously

## Querying Content

Content is fetched via GROQ queries in `app/sanity/lib/queries.ts`. The frontend uses `sanity-content.service.ts` which implements the `IContentService` interface.
