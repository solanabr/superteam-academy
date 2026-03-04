# AGENTS.md

## Editing Rule
- Only edit UI-related code unless the user explicitly requests otherwise.

## UI Scope
- Allowed: `components/**`, `app/**` UI pages/layouts, styling files (`*.css`, `tailwind.config.*`), and other presentational frontend code.
- Not allowed by default: backend logic, API routes, database code, auth logic, on-chain/program logic, scripts, infra/config not directly tied to UI.

## Exception
- If a requested UI change requires a non-UI change, stop and ask for explicit approval before touching non-UI files.

## Type Safety Rule
- Do not introduce `any` types.
- Prefer concrete interfaces/types, generics, discriminated unions, or `unknown` with type narrowing.
- If an existing `any` must be touched, replace it with a safer typed alternative in the same change.
