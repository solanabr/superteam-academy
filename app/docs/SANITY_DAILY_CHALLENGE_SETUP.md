# Daily Challenge CMS Setup (Sanity)

This project now supports daily challenges from Sanity via the `dailyChallenge` document type.

## 1. Required Environment Variables

Add these to your app environment (`.env.local` and deployment env):

```bash
# Existing Sanity vars
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
NEXT_PUBLIC_USE_SANITY=true

# Daily challenge runtime config
NEXT_PUBLIC_DAILY_CHALLENGE_COURSE_ID=your_onchain_course_id
NEXT_PUBLIC_DAILY_CHALLENGE_XP=50
NEXT_PUBLIC_DAILY_CHALLENGE_TIMER_MINUTES=45
NEXT_PUBLIC_DAILY_CHALLENGE_SLOT_COUNT=366
NEXT_PUBLIC_DAILY_CHALLENGE_EPOCH_DATE=2026-01-01
```

Notes:
- `NEXT_PUBLIC_DAILY_CHALLENGE_COURSE_ID` is needed for on-chain XP minting via existing `complete-lesson` flow.
- `XP` and `timer` are fixed globally by default; per-document overrides are optional.
- `slot_count` should match the practical one-submission/day horizon you want for the mapped on-chain lesson index.

## 2. Studio Access

Run the app:

```bash
pnpm dev
```

Open Studio at:

- `http://localhost:3000/studio`

You should see a `Daily Challenge` document type.

## 3. Authoring Rules for CMS Team

Create one `Daily Challenge` doc per UTC date.

Fields to fill:
- `Challenge Date (UTC)` : Must be the UTC day (`YYYY-MM-DD`).
- `Title`
- `Prompt`
- `Language` (`typescript`, `rust`, or `json`)
- `Starter Code`
- `Reference Solution`
- `Test Cases` (required; at least 1)

Optional fields:
- `Hints`
- `XP Reward`
- `Time Limit Minutes`

## 4. Test Case Syntax (Important)

`Expected Check` supports one rule per line.

Rule formats:
- Plain text: substring must exist in learner code
- `contains:<text>`: explicit substring check
- `regex:<pattern>`: regex check
- `regex:/pattern/flags`: regex with flags

Examples:

```text
contains:PublicKey.findProgramAddressSync(
contains:Buffer.from("vault")
regex:/programId\.toBuffer\(\)/
```

## 5. Publishing Workflow

1. Create challenge doc for the target UTC day.
2. Validate test cases and code blocks.
3. Publish (top-right Publish action in Studio).

The app endpoint `/api/challenges/daily` selects:
1. exact match for current UTC date,
2. otherwise latest published challenge with `challengeDate <= today`.

## 6. Operational Recommendation

To avoid day gaps:
- prepare and publish at least 7 days of daily challenges ahead of time,
- use UTC dates consistently (do not use local timezone assumptions).
