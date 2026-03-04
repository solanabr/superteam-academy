# API Notes

## `/api/auth/[...nextauth]`
- Handles NextAuth sign-in/session endpoints
- Google provider enabled only when credentials exist

## `/api/locale`
- `POST` body `{ locale: "en" | "pt-br" | "es" }`
- Sets `NEXT_LOCALE` cookie for UI language

## Future APIs (planned)
- lesson progress write endpoint
- achievement minting request endpoint
- leaderboard snapshot endpoint
