---
paths:
  - "apps/web/src/lib/solana/**"
  - "apps/web/src/lib/courses/**"
  - "apps/web/src/lib/admin/**"
  - "apps/web/src/lib/helius/**"
  - "apps/web/src/app/api/lessons/**"
  - "apps/web/src/app/api/admin/**"
  - "apps/web/src/app/api/webhooks/**"
---

# On-chain client rules

- Two decoders, two naming conventions. The raw `BorshCoder` reads in `lib/solana/academy-reads.ts`
  (`fetchConfig`, `fetchCourse`, `fetchEnrollment`) use the raw JSON IDL and return snake_case
  fields (`xp_mint`, `lesson_flags`). `program.account.*.fetch()` in `lib/solana/academy-program.ts`
  returns camelCase (`xpMint`, `lessonFlags`), because the `Program` constructor camel-cases the
  IDL. `program.methods.*`, `program.account.*` and `.accountsPartial()` keys are camelCase too.
- The Course account is versioned by length: 224 bytes is v1 (`superteam_academy.json`), 253 bytes
  is v-next (`superteam_academy_vnext.json`). Decode by length (`decodeCourse`); any other length
  throws. Never decode a Course with a single coder.
- Content `_id`s go into PDA seeds exactly as they are, e.g. `achievement-first-steps`, not
  `first-steps`. Transform ids only for display. A stripped id derives a different PDA and fails
  later as "Account does not exist" in the on-chain queue.
- A lesson's on-chain bit is its slot from the slot lock: `getLessonSlot()` in
  `lib/courses/lesson-slot.ts`. Use it for `complete_lesson`, bitmap tests and
  `user_progress.lesson_index`. Never use `findLessonIndex()`: array position shifts when a course
  is restructured and silently completes a different lesson. `getLessonSlot()` throws on a missing
  slot, and there is deliberately no fallback.
