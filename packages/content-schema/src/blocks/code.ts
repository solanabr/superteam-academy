import { z } from "zod";
import { blockBase, relativePath } from "./base";

export const LANGUAGES = ["typescript", "rust"] as const;
export const BUILD_TYPES = ["standard", "buildable"] as const;

const EXT: Record<(typeof LANGUAGES)[number], string> = {
  typescript: ".ts",
  rust: ".rs",
};

/**
 * A single graded case. Lives in `tests.json`, not the block, because
 * `expectedOutput` is compared byte-for-byte and YAML coerces `1.0` to `1`.
 */
export const TestCase = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  input: z.string(),
  expectedOutput: z.string(),
  /**
   * Teacher-authored explanation shown when THIS case fails (issue #575, LX-C3).
   * Optional — absent leaves the failure display exactly as today. Authored, never
   * LLM-generated (UIUX-04 / F17: expert-written per-test explanations beat both
   * stock and GPT-4 messages). One or two sentences; bounded so it stays a nudge,
   * not a wall of text. EN-only v1 — localization rides the content-i18n mechanism
   * (LX-D5), never scoped to one field.
   */
  failureMessage: z.string().min(1).max(300).optional(),
});
export type TestCaseT = z.infer<typeof TestCase>;

export const CodeBlock = z
  .object({
    type: z.literal("code"),
    ...blockBase,
    language: z.enum(LANGUAGES),
    /** `buildable` compiles via the Anchor build server; `standard` runs in the isolate/Playground. */
    buildType: z.enum(BUILD_TYPES).default("standard"),
    /** Shows the Deploy-to-Devnet panel after a successful build. */
    deployable: z.boolean().default(false),
    starter: z.string().min(1),
    solution: z.string().min(1),
    tests: relativePath(".json"),
    hints: z.array(z.string().min(1)).default([]),
    /**
     * Teacher-authored "common mistakes" for this challenge, fed to the AI
     * Partner as `[TUTOR_NOTES]` (issue #592). This is the second half of the
     * evidenced output contract (AIE-25/-26): the reference solution already
     * reaches the model, these authored nudges never did. Optional — absent
     * leaves the AI prompt exactly as today. Each note is one bullet; keep them
     * to the common wrong turns, NEVER the answer. Bounded (max 6 × 500 chars)
     * so authored input can never dominate the cache-shaped prefix.
     */
    tutorNotes: z.array(z.string().min(1).max(500)).max(6).optional(),
  })
  .refine((b) => b.buildType !== "buildable" || b.language === "rust", {
    message: "buildType 'buildable' requires language 'rust'",
    path: ["buildType"],
  })
  .refine((b) => !b.deployable || b.buildType === "buildable", {
    message: "deployable requires buildType 'buildable'",
    path: ["deployable"],
  })
  .refine((b) => b.starter.endsWith(EXT[b.language]), {
    message: "starter extension must match language",
    path: ["starter"],
  })
  .refine((b) => b.solution.endsWith(EXT[b.language]), {
    message: "solution extension must match language",
    path: ["solution"],
  })
  // Gate 13a's local half (PR #350 review): a capability may only be produced by
  // a block type that can actually create it. A code block can only ever produce
  // `deployed-program`, and only when it is deployable — otherwise a stray
  // `produces:` satisfies the CI ordering check with a producer that produces
  // nothing.
  .refine(
    (b) => b.produces === undefined || b.produces === "deployed-program",
    {
      message: "a code block may only produce 'deployed-program'",
      path: ["produces"],
    }
  )
  .refine((b) => b.produces !== "deployed-program" || b.deployable, {
    message: "only a deployable code block may produce 'deployed-program'",
    path: ["produces"],
  });

export type CodeBlockT = z.infer<typeof CodeBlock>;
