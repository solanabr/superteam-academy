# Superteam Academy - CMS Guide

This project uses Sanity.io as a Headless CMS.

## Content Schema

### Course

- `title`: String
- `slug`: Slug (URL identifier)
- `description`: Text
- `image`: Image
- `difficulty`: Selection (Beginner, Intermediate, Advanced)
- `modules`: Array of References to `Module`

### Module

- `title`: String
- `lessons`: Array of References to `Lesson`

### Lesson

- `title`: String
- `slug`: Slug
- `type`: Selection (Video, Text, Challenge)
- `content`: Markdown
- `xp`: Number (Reward amount)
- `initialCode`: Code (for Challenges)
- `testCode`: Code (Validation logic)
- `aiContext`: String (Hidden field for AI prompts)

## Editing Content

1. Go to `http://localhost:3000/studio` (Local) or `https://academy.superteam.fun/studio` (Production).
2. Log in with your Superteam credentials.
3. Create a new **Course** or edit existing ones.
4. Publish changes.

## Mock Mode

Currently, the project is running in **Mock Mode** using `src/lib/content.ts`. To switch to real Sanity data:

1. Set `NEXT_PUBLIC_USE_MOCK=false` in `.env`.
2. Configure `SANITY_PROJECT_ID` and `SANITY_DATASET`.
