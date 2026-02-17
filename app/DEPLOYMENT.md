# Deployment (MVP)

This is the Next.js MVP scaffold for Superteam Academy.

## Local dev

```bash
cd app
pnpm install
pnpm dev
```

Open http://localhost:3000

## Vercel

- Import the repo in Vercel
- Set **Root Directory** to `app/`
- Framework preset: Next.js
- Build command: `pnpm build`
- Output: `.next`

## Notes

- Auth is currently a stub (httpOnly cookie via `/api/auth/login`).
- Course data is mocked in `src/lib/courses.ts`.
- Next: replace stub auth with Auth.js/Clerk/Supabase + add a CMS (Sanity/Contentlayer/etc).
