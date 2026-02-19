# Admin Panel Guide

The Solarium admin panel provides tools for syncing Sanity CMS content to the on-chain program.

## Accessing the Admin Panel

The admin panel is available at `/{locale}/admin` (e.g., `/en/admin`).

**Authentication**: The panel is protected by a shared secret. On the login page, enter the value of `ADMIN_SECRET` from your environment variables.

## Required Environment Variables

| Variable                   | Description                                                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_SECRET`             | Admin password (min 32 chars, random). Set in `.env.local`.                                                                                     |
| `PROGRAM_AUTHORITY_SECRET` | Base58 private key of the keypair that is authority on the on-chain `Config` PDA.                                                               |
| `BACKEND_SIGNER_SECRET`    | Base58 private key of the backend signer registered in `Config.backend_signer`. Used to sign on-chain transactions from API routes.             |
| `SANITY_ADMIN_TOKEN`       | Sanity write token from [sanity.io/manage](https://sanity.io/manage). Required to sync `onChainStatus` back to Sanity after deploying a course. |

## Course Sync Workflow

### Overview

Course content lives in Sanity CMS. On-chain course state lives in the Solana program. The admin panel bridges these two.

A course must be in `onChainStatus.status == "synced"` before it appears to learners.

### Steps to deploy a new course

1. **Create the course in Sanity Studio** (`/studio`) with all modules, lessons, and metadata.
2. **Open the admin panel** at `/en/admin`.
3. **Select "Deploy Course"** and choose the course from the Sanity course list.
4. The admin panel will:
   - Call `create_course` on-chain (via `PROGRAM_AUTHORITY_SECRET`)
   - Create a Metaplex Core collection for the course track (via `deployCourseTrackCollection`)
   - Update `onChainStatus` in Sanity to `{ status: "synced", ... }` (via `SANITY_ADMIN_TOKEN`)
5. The course is now visible in the learner-facing platform.

### Steps to deploy achievements

1. Open the admin panel at `/en/admin`.
2. Select "Deploy Achievement".
3. The admin panel calls `create_achievement_type` on-chain and creates the Metaplex Core collection.

### Troubleshooting

- **"Unauthorized"**: Check that `ADMIN_SECRET` is set and matches the value used at login.
- **"Transaction failed"**: Verify `PROGRAM_AUTHORITY_SECRET` is the correct authority keypair and has SOL for fees.
- **"Sanity update failed"**: Verify `SANITY_ADMIN_TOKEN` has write access to the dataset.
- **Course not appearing to learners**: Check `onChainStatus.status` in Sanity Studio — it must be `"synced"`.

## Security Notes

- `ADMIN_SECRET` should be at least 32 random characters. Never commit it to version control.
- `PROGRAM_AUTHORITY_SECRET` and `BACKEND_SIGNER_SECRET` must never be exposed to the browser — all admin API routes use `import "server-only"`.
- The admin panel is for internal use only. Do not expose it publicly without additional authentication.
