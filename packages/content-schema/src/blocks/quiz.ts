import { z } from "zod";
import { blockBase } from "./base";

const unique = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;

/**
 * Correctness is keyed to a stable option `id`, never an array index — both edX
 * OLX (`<choice name="a" correct="true">`) and IMS QTI (`<simpleChoice
 * identifier="ChoiceA">`) do this, because reordering options must not silently
 * change the answer.
 */
export const QuizOption = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  correct: z.boolean(),
  /** Shown when the learner picks this specific option. OLX `<choicehint>`. */
  feedback: z.string().min(1).optional(),
});

export const QuizQuestion = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(1),
    /** true → correctness is a SET of option ids (QTI `cardinality="multiple"`). */
    multiSelect: z.boolean().default(false),
    options: z.array(QuizOption).min(2),
    /** Shown after submission regardless of choice. OLX `<solution>`. */
    explanation: z.string().min(1).optional(),
  })
  .refine((q) => unique(q.options.map((o) => o.id)), {
    message: "option ids must be unique within a question",
    path: ["options"],
  })
  .refine((q) => q.options.some((o) => o.correct), {
    message: "at least one option must be correct",
    path: ["options"],
  })
  .refine(
    (q) => q.multiSelect || q.options.filter((o) => o.correct).length === 1,
    {
      message: "exactly one option must be correct when multiSelect is false",
      path: ["options"],
    }
  );

export const QuizBlock = z
  .object({
    type: z.literal("quiz"),
    ...blockBase,
    questions: z.array(QuizQuestion).min(1),
  })
  .refine((b) => unique(b.questions.map((q) => q.id)), {
    message: "question ids must be unique within a quiz",
    path: ["questions"],
  });

export type QuizBlockT = z.infer<typeof QuizBlock>;
