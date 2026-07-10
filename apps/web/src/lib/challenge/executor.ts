/**
 * The JS/TS challenge executor now lives in `@superteam-lms/challenge-executor`
 * so the content linter (packages/content-lint) can reuse the SAME oracle that
 * grades learners at runtime. This shim preserves every existing
 * `@/lib/challenge/executor` import (rust-executor, buildable-executor,
 * validate, tests) unchanged.
 */
export * from "@superteam-lms/challenge-executor";
