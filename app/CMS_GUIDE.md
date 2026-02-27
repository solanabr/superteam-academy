# Superteam Academy — CMS Guide (Sanity)

## Setup

1. Create a Sanity project at [sanity.io](https://sanity.io)
2. Set `NEXT_PUBLIC_SANITY_PROJECT_ID` in `.env.local`
3. Install Sanity CLI: `npm i -g @sanity/cli`
4. Open the embedded studio: navigate to `/studio` in your Next.js app, or deploy at `studio.sanity.io`

## Schema Overview

```
course
  ├── title, slug, description, difficulty
  ├── durationHours, xpReward, trackId
  ├── thumbnail, instructor (reference)
  ├── modules[] (references)
  ├── tags, prerequisiteSlug, onChainCourseId
  └── publishedAt

module
  ├── title, description, order
  └── lessons[] (references)

lesson
  ├── title, type (content|challenge), order
  ├── xpReward, estimatedMinutes
  │
  ├── [type=content]
  │   └── content (Portable Text + code blocks + images)
  │
  └── [type=challenge]
      ├── starterCode
      ├── solutionCode
      └── testCases[] { description, input, expectedOutput }

instructor
  ├── name, bio, avatar
  ├── twitterHandle, githubHandle
```

## Creating a Course

### Step 1 — Create the Instructor

1. Go to Sanity Studio → Instructor → New
2. Fill in name, bio, avatar
3. Publish

### Step 2 — Create Lessons

1. Studio → Lesson → New
2. Set type: `content` or `challenge`
3. For **content lessons**:
   - Write content in the rich text editor
   - Add code blocks with language selection (Rust, TypeScript, JSON, Bash)
4. For **challenge lessons**:
   - Write starter code (what learners see)
   - Write solution code (reference only, not shown)
   - Add test cases: description, input, expected output
5. Set XP Reward and estimated minutes
6. Publish

### Step 3 — Create Modules

1. Studio → Module → New
2. Set title, description, order (1, 2, 3...)
3. Add lessons in order
4. Publish

### Step 4 — Create the Course

1. Studio → Course → New
2. Fill in title, slug (auto-generated from title)
3. Write description (max 300 chars) and long description
4. Set difficulty, duration, XP reward, track ID
5. Upload thumbnail
6. Select instructor
7. Add modules in order
8. Set `onChainCourseId` to match the `courseId` in the Anchor program (e.g. `anchor-101`)
9. Set `publishedAt` to publish
10. Save and publish

## Track IDs

| ID | Name |
|---|---|
| 1 | Solana Basics |
| 2 | Anchor Framework |
| 3 | DeFi |
| 4 | NFTs & Digital Assets |
| 5 | Full-Stack Solana |

## Sample Course JSON (for seeding)

```json
{
  "_type": "course",
  "title": "Solana Basics",
  "slug": { "current": "solana-basics" },
  "description": "Learn the fundamentals of Solana: accounts, programs, transactions, and the Solana programming model.",
  "difficulty": "beginner",
  "durationHours": 3,
  "xpReward": 500,
  "trackId": 1,
  "onChainCourseId": "solana-basics-01",
  "tags": ["solana", "basics", "accounts", "programs"]
}
```

## Content Formatting Tips

- Use **Heading 2** for major sections, **Heading 3** for subsections
- Use code blocks with language set for all code snippets
- Keep lesson content focused — aim for 5-15 min reading time
- Challenge lessons should have 2-5 test cases that validate specific behavior
- Starter code should compile (even if the function returns dummy values)
