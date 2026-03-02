# CMS Guide (Sanity)

## Schema Types

| Type | Description | Key Fields |
|------|------------|------------|
| `track` | Learning track | trackId, name, color, icon |
| `course` | Full course | courseId, title, slug, lessons[], author |
| `lesson` | Single lesson | title, order, type, content (Portable Text) |
| `codeChallenge` | Code exercise | starterCode, solutionCode, testCases[] |
| `author` | Course creator | name, avatar, wallet |
| `achievement` | Badge/reward | achievementId, rarity, xpReward |

## Creating a Course

1. Create an **Author** document (name, avatar, wallet address)
2. Create **Lesson** documents for each lesson (set `order` 0-indexed)
3. If any lessons are code challenges, create **CodeChallenge** documents first
4. Create the **Course** document:
   - Set `courseId` to match the on-chain PDA seed (e.g., `solana-101`)
   - Add all lessons in order via the `lessons` array reference
   - Set `trackId` to match the on-chain track
   - Set `difficulty` (1=Beginner, 2=Intermediate, 3=Advanced)
   - Set `lessonCount` and `xpPerLesson` to match on-chain values

## Content Types (Portable Text)

Lesson content supports:
- **Text blocks**: headings (h1-h4), paragraphs, lists, blockquotes
- **Code blocks**: language, filename, code content
- **Callouts**: info, warning, tip, danger
- **Images**: with alt text and captions

## On-Chain Mapping

The `courseId` field in Sanity MUST match the `courseId` used as the PDA seed on-chain. Same for `achievementId`. These values cannot be changed after creation.

## ISR Webhooks

Configure a Sanity webhook to hit `/api/revalidate` on content publish to trigger ISR revalidation.
