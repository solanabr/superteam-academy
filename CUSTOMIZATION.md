# Customization Guide

See full customization details in:

- `onchain-academy/app/CUSTOMIZATION.md`

## Submission Upgrade Notes

The app now supports a remote-first backend mode:

- Configure Supabase variables in `onchain-academy/app/.env.local` to persist enrollments, lesson completions, streak days, and activity feed.
- Configure `NEXT_PUBLIC_PRIVY_APP_ID` to enable social/wallet auth bridge in onboarding and header.
- Without those variables, all flows still run in local fallback mode for demo resilience.
