# Unit Test Report

**Framework:** Vitest 4.0.18  
**Date:** 2026-03-03  
**Result:** ✅ **33 files — 196 tests — ALL PASSING**  
**Duration:** ~9.3s

---

## Summary

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| Backend — Core | 5 | 42 | ✅ Pass |
| Backend — Auth | 5 | 21 | ✅ Pass |
| Backend — Admin | 1 | 5 | ✅ Pass |
| Context — Utilities | 4 | 53 | ✅ Pass |
| Context — Solana | 3 | 40 | ✅ Pass |
| Lib | 1 | 7 | ✅ Pass |
| API Routes | 14 | 28 | ✅ Pass |
| **Total** | **33** | **196** | **✅ All Pass** |

---

## Detailed Results

### Backend — Core (5 files, 42 tests)

#### `errors.test.ts` — 16 tests
| Test | Result |
|------|--------|
| AppError sets message, code, and statusCode | ✅ |
| AppError defaults statusCode to 500 | ✅ |
| AppError is an instance of Error | ✅ |
| AppError preserves cause via ErrorOptions | ✅ |
| RpcError has correct defaults (502, RPC_ERROR) | ✅ |
| RpcError is an instance of AppError | ✅ |
| ValidationError has correct defaults (400, VALIDATION_ERROR) | ✅ |
| ValidationError is an instance of AppError | ✅ |
| ServiceError has correct defaults (422, SERVICE_ERROR) | ✅ |
| ServiceError accepts custom code and statusCode | ✅ |
| ServiceError is an instance of AppError | ✅ |
| isAppError returns true for AppError instances | ✅ |
| isAppError returns false for plain errors and non-errors | ✅ |
| toSafeErrorResponse returns error details for AppError | ✅ |
| toSafeErrorResponse hides details for generic Error | ✅ |
| toSafeErrorResponse hides details for non-Error values | ✅ |

#### `retry.test.ts` — 15 tests
| Test | Result |
|------|--------|
| withRetry returns result on first successful call | ✅ |
| withRetry retries on failure and eventually succeeds | ✅ |
| withRetry throws after exhausting retries | ✅ |
| withRetry respects shouldRetry predicate | ✅ |
| isTransientError detects rate limiting (429) | ✅ |
| isTransientError detects service unavailable (503) | ✅ |
| isTransientError detects bad gateway (502) | ✅ |
| isTransientError detects timeout | ✅ |
| isTransientError detects connection reset | ✅ |
| isTransientError detects connection refused | ✅ |
| isTransientError detects fetch failed | ✅ |
| isTransientError detects Solana blockhash error | ✅ |
| isTransientError detects Solana node behind | ✅ |
| isTransientError returns false for non-transient errors | ✅ |
| isTransientError returns false for non-Error values | ✅ |

#### `redis.test.ts` — 4 tests
| Test | Result |
|------|--------|
| getRedis throws when env vars are missing | ✅ |
| getRedisOptional returns null when env vars are missing | ✅ |
| getRedis returns a Redis instance when configured | ✅ |
| getRedis returns the same singleton instance | ✅ |

#### `achievements.test.ts` — 6 tests
| Test | Result |
|------|--------|
| ACHIEVEMENTS is a non-empty array | ✅ |
| Each achievement has required fields | ✅ |
| All IDs are unique | ✅ |
| Categories are valid | ✅ |
| Badge paths are SVG files | ✅ |
| Has the expected total (13 achievements) | ✅ |

#### `prisma.test.ts` — 1 test
| Test | Result |
|------|--------|
| Exports a prisma instance | ✅ |

### Backend — Auth (5 files, 21 tests)

#### `auth/validation.test.ts` — 8 tests
| Test | Result |
|------|--------|
| Returns true for valid Solana address | ✅ |
| Returns true for another valid address | ✅ |
| Returns false for empty string | ✅ |
| Returns false for too short strings | ✅ |
| Returns false for too long strings | ✅ |
| Returns false for invalid characters | ✅ |
| Returns false for strings with spaces | ✅ |
| Returns false for non-base58 characters | ✅ |

#### `auth/rate-limit.test.ts` — 2 tests
| Test | Result |
|------|--------|
| Passes through when Redis is not configured in dev | ✅ |
| Returns 503 in production when Redis is not configured | ✅ |

#### `auth/nonce-store.test.ts` — 4 tests
| Test | Result |
|------|--------|
| Stores and retrieves a nonce | ✅ |
| getNonce consumes the nonce (one-time use) | ✅ |
| Returns null for non-existent nonce | ✅ |
| deleteNonce removes the nonce | ✅ |

#### `auth/lockout.test.ts` — 4 tests
| Test | Result |
|------|--------|
| isLockedOut returns false for unknown identifier | ✅ |
| recordFailedAttempt returns false below threshold | ✅ |
| Lockout activates after 5 failed attempts | ✅ |
| clearFailedAttempts resets the lockout | ✅ |

#### `auth/audit.test.ts` — 3 tests
| Test | Result |
|------|--------|
| Calls prisma.audit_logs.create with correct data | ✅ |
| Does not throw when prisma call fails | ✅ |
| Handles optional fields | ✅ |

### Backend — Admin (1 file, 5 tests)

#### `admin/utils.test.ts` — 5 tests
| Test | Result |
|------|--------|
| ADMIN_PAGE_SIZE is 20 | ✅ |
| ADMIN_ACTIVITY_LIMIT is 20 | ✅ |
| startOfToday returns a Date object | ✅ |
| startOfToday has hours/minutes/seconds/ms set to 0 | ✅ |
| startOfToday has the current date | ✅ |

### Context — Utilities (4 files, 53 tests)

#### `xp-calculations.test.ts` — 20 tests
| Test | Result |
|------|--------|
| calculateLevel returns 1 for 0 XP | ✅ |
| calculateLevel returns 1 for negative XP | ✅ |
| calculateLevel returns 2 at exactly 1000 XP | ✅ |
| calculateLevel returns 2 for 999 XP (below threshold) | ✅ |
| calculateLevel returns MAX_LEVEL for very high XP | ✅ |
| calculateLevel returns 10 at exactly 120,000 XP | ✅ |
| calculateLevel handles all level boundaries | ✅ |
| getXpForLevel returns 0 for level 1 | ✅ |
| getXpForLevel returns 1000 for level 2 | ✅ |
| getXpForLevel clamps to level 1 for level 0 | ✅ |
| getXpForLevel clamps to MAX_LEVEL | ✅ |
| getNextLevelXp returns 1000 for 0 XP | ✅ |
| getNextLevelXp returns Infinity at max level | ✅ |
| getNextLevelXp returns Infinity beyond max level | ✅ |
| getLevelProgress returns 0 at start | ✅ |
| getLevelProgress returns 50 at halfway | ✅ |
| getLevelProgress returns 100 at max | ✅ |
| getLevelProgress returns value between 0 and 100 | ✅ |
| calculateCompletionBonus computes correctly | ✅ |
| calculateCreatorReward returns reward when threshold met | ✅ |

#### `constants.test.ts` — 21 tests
| Test | Result |
|------|--------|
| Pagination, content limits, notifications, queue/retry, cache TTLs, achievement IDs, course milestones, GDPR — all verified | ✅ |

#### `env.test.ts` — 8 tests
| Test | Result |
|------|--------|
| getRequiredEnv returns value when set | ✅ |
| getRequiredEnv returns devFallback in non-production | ✅ |
| getRequiredEnv throws in production when missing | ✅ |
| safeErrorDetails returns message in development | ✅ |
| safeErrorDetails returns undefined in production | ✅ |
| safeErrorDetails converts non-Error in development | ✅ |
| getRpcUrl returns configured URL | ✅ |
| getRpcUrl returns devnet fallback | ✅ |

#### `utils.test.ts` — 4 tests
| Test | Result |
|------|--------|
| cn is exported as a function | ✅ |
| cn merges class names | ✅ |
| cn handles empty inputs | ✅ |
| cn handles undefined/false/null | ✅ |

### Context — Solana (3 files, 40 tests)

#### `solana/bitmap.test.ts` — 23 tests
| Test | Result |
|------|--------|
| isLessonComplete — bit set, not set, higher positions, out of bounds, multiple words, all bits | ✅ |
| countCompletedLessons — empty, none, single, multiple, beyond count, multi-word | ✅ |
| getCompletedLessonIndices — no completions, correct indices, limit to count | ✅ |
| getProgressPercentage — 0%, 50%, 100%, rounding | ✅ |
| isCourseFullyCompleted — all, partial, empty course | ✅ |

#### `solana/pda.test.ts` — 12 tests
| Test | Result |
|------|--------|
| deriveConfigPda returns PublicKey + bump, is deterministic | ✅ |
| deriveCoursePda differs for different IDs, deterministic for same | ✅ |
| deriveEnrollmentPda differs for different learners | ✅ |
| deriveMinterRolePda returns PublicKey + bump | ✅ |
| deriveAchievementTypePda differs for different IDs | ✅ |
| deriveAchievementReceiptPda is deterministic | ✅ |

#### `solana/constants.test.ts` — 5 tests
| Test | Result |
|------|--------|
| PROGRAM_ID, XP_MINT, TOKEN_2022, MPL_CORE — valid PublicKeys, all distinct | ✅ |

### Lib (1 file, 7 tests)

#### `banner-constants.test.ts` — 7 tests
| Test | Result |
|------|--------|
| BANNER exported, challenges light/dark, community, achievements — all WebP srcs and base64 blur URIs | ✅ |

### API Routes (14 files, 28 tests)

| Route | Tests | Status |
|-------|-------|--------|
| `api/health` | 5 | ✅ |
| `api/courses` | 1 | ✅ |
| `api/leaderboard` | 1 | ✅ |
| `api/achievements` | 1 | ✅ |
| `api/community` | 1 | ✅ |
| `api/profile` | 1 | ✅ |
| `api/xp` | 1 | ✅ |
| `api/streak` | 1 | ✅ |
| `api/notifications` | 1 | ✅ |
| `api/code/execute` | 1 | ✅ |
| `api/credentials` | 1 | ✅ |
| `api/lessons` | 1 | ✅ |
| `api/events` | 1 | ✅ |
| `api/admin/stats` | 2 | ✅ |

---

## Commands

```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report in test/reports/coverage/
```
