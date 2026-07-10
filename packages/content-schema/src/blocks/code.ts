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
  });

export type CodeBlockT = z.infer<typeof CodeBlock>;
