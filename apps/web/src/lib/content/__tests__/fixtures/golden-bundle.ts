import { contentImageUrl } from "@/lib/content/compile/assets";
import type { RawBundle } from "@/lib/content/types";

/**
 * The fixed input of `project.golden.test.ts`: a handful of RAW bundle docs in
 * the exact shape `compile-content` emits (weak `_ref`s, `{ _type: "slug" }`
 * slugs, prose inlined, image paths already rewritten to blob urls). Each doc
 * is here to exercise one real projection branch, noted next to it. It never
 * follows `content.lock` — a content release must not touch it.
 */

const ref = (id: string) => ({
  _key: id,
  _ref: id,
  _type: "reference",
  _weak: true,
});
const slug = (current: string) => ({ _type: "slug" as const, current });
const image = (byte: string, ext = "webp") =>
  contentImageUrl(byte.repeat(64), ext);

const WALLET = "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ";

export const goldenBundle: RawBundle = {
  courses: [
    {
      // Every projected field set, plus the on-chain-only fields
      // (`xpPerLesson`, `creatorRewardXp`, …) the projection must drop. Its
      // first module carries a ref to a lesson that is not in the bundle: the
      // projection drops it (#405), the raw lesson count still counts it.
      _id: "course-alpha",
      _type: "course",
      slug: slug("alpha"),
      title: "Alfa: da tese ao primeiro ativo",
      description: "Por que a Solana, e o seu primeiro ativo onchain.",
      difficulty: "beginner",
      duration: 0.25,
      thumbnail: image("a"),
      creator: WALLET,
      tags: ["account-model", "keypairs-wallets"],
      xpReward: 60,
      xpPerLesson: 20,
      creatorRewardXp: 30,
      minCompletionsForReward: 0,
      sourceLocale: "pt-BR",
      trackId: 1,
      trackLevel: 2,
      modules: [
        {
          _key: "fundamentos",
          _type: "courseModule",
          key: "fundamentos",
          title: "Fundamentos",
          lessons: [
            ref("lesson-alpha-quiz"),
            ref("lesson-alpha-retired"),
            ref("lesson-alpha-code"),
          ],
        },
        {
          _key: "deploy",
          _type: "courseModule",
          key: "deploy",
          title: "Deploy",
          description: "Coloque um programa na devnet.",
          lessons: [ref("lesson-alpha-deploy")],
        },
      ],
    },
    {
      // The sparse course: no description, thumbnail, creator, tags or track,
      // so every optional field projects as null. Its second module is empty,
      // which the quest module map drops.
      _id: "course-beta",
      _type: "course",
      slug: slug("beta"),
      title: "Beta",
      difficulty: "intermediate",
      xpReward: 10,
      xpPerLesson: 10,
      sourceLocale: "en",
      modules: [
        {
          _key: "order",
          _type: "courseModule",
          key: "order",
          title: "Put it in order",
          lessons: [ref("lesson-beta-parsons")],
        },
        {
          _key: "later",
          _type: "courseModule",
          key: "later",
          title: "Coming later",
          lessons: [],
        },
      ],
    },
    {
      // A Sanity-era draft id: the quest module map must skip it.
      _id: "drafts.course-beta",
      _type: "course",
      slug: slug("beta-draft"),
      title: "Beta (draft)",
      modules: [
        {
          _key: "order",
          _type: "courseModule",
          key: "order",
          title: "Put it in order",
          lessons: [ref("lesson-beta-parsons")],
        },
      ],
    },
  ],

  lessons: [
    {
      // Prose with an inline figure, a two-question quiz (one multi-select,
      // one option without feedback) and a video.
      _id: "lesson-alpha-quiz",
      _type: "lesson",
      slug: slug("hash-everything"),
      title: "Hash em tudo",
      skills: ["account-model"],
      blocks: [
        {
          _key: "intro",
          _type: "prose",
          src: `# Hash em tudo\n\n![Diagrama](${image("b")})\n\nUm hash é uma impressão digital.`,
        },
        {
          _key: "check",
          _type: "quiz",
          questions: [
            {
              id: "q1",
              prompt: "O que muda quando um byte da entrada muda?",
              multiSelect: false,
              explanation: "Qualquer mudança gera um hash diferente.",
              options: [
                {
                  id: "a",
                  label: "Só o último byte do hash",
                  correct: false,
                  feedback: "A mudança se espalha pelo hash inteiro.",
                },
                {
                  id: "b",
                  label: "O hash inteiro",
                  correct: true,
                  feedback: "Isso.",
                },
              ],
            },
            {
              id: "q2",
              prompt: "Quais destes são hashes?",
              multiSelect: true,
              options: [
                { id: "a", label: "SHA-256", correct: true },
                {
                  id: "b",
                  label: "Ed25519",
                  correct: false,
                  feedback: "Assinatura.",
                },
                { id: "c", label: "Keccak-256", correct: true },
              ],
            },
          ],
        },
        {
          _key: "video",
          _type: "video",
          url: "https://www.youtube.com/watch?v=5I1L1FTfEOw",
        },
      ],
    },
    {
      // A standard code challenge: hints, tutor notes, and one test with an
      // authored failure message next to one without.
      _id: "lesson-alpha-code",
      _type: "lesson",
      slug: slug("resume-from-cursor"),
      title: "Retome do cursor",
      skills: ["keypairs-wallets"],
      blocks: [
        { _key: "intro", _type: "prose", src: "Retome a partir do cursor." },
        {
          _key: "exercise",
          _type: "code",
          language: "typescript",
          buildType: "standard",
          deployable: false,
          starter: "export function resume(cursor: number) {\n  // TODO\n}\n",
          solution:
            "export function resume(cursor: number) {\n  return cursor + 1;\n}\n",
          hints: ["Avance o cursor.", "Retorne o próximo id."],
          tutorNotes: ["O erro comum é reaplicar o próprio cursor."],
          tests: [
            {
              id: "t1",
              description: "avança o cursor",
              input: "5",
              expectedOutput: "result === 6",
              failureMessage: "Comece do cursor + 1.",
            },
            {
              id: "t2",
              description: "começa do zero",
              input: "0",
              expectedOutput: "result === 1",
            },
          ],
        },
      ],
    },
    {
      // The deploy chain: funding → buildable, deployable Rust → program card,
      // then a reflection prompt.
      _id: "lesson-alpha-deploy",
      _type: "lesson",
      slug: slug("your-first-program"),
      title: "Seu primeiro programa",
      skills: ["keypairs-wallets"],
      blocks: [
        {
          _key: "fund",
          _type: "wallet-funding",
          amount: 2,
          network: "devnet",
          produces: "funded-wallet",
        },
        {
          _key: "ping-program",
          _type: "code",
          language: "rust",
          buildType: "buildable",
          deployable: true,
          consumes: ["funded-wallet"],
          produces: "deployed-program",
          starter: "use anchor_lang::prelude::*;\n",
          solution: "use anchor_lang::prelude::*;\npub fn ping() {}\n",
          tests: [
            {
              id: "t1",
              description: "compila",
              input: "",
              expectedOutput: "true",
            },
          ],
        },
        {
          _key: "deployed",
          _type: "deployed-program-card",
          consumes: ["deployed-program"],
        },
        {
          _key: "reflect",
          _type: "openEnded",
          prompt: "O que o programa faz quando recebe um ping?",
          maxWords: 120,
        },
      ],
    },
    {
      // A Parsons block: its grader inputs surface only on this block type.
      _id: "lesson-beta-parsons",
      _type: "lesson",
      slug: slug("parsons"),
      title: "Order the instructions",
      skills: [],
      blocks: [
        {
          _key: "order",
          _type: "parsons",
          prompt: "Put the transfer in order.",
          lines: [
            { id: "l2", text: "sign the transaction", distractor: false },
            { id: "l1", text: "build the instruction", distractor: false },
            { id: "d1", text: "skip the signature", distractor: true },
          ],
          correctOrder: ["l1", "l2"],
          explanation: "You sign what you built.",
        },
      ],
    },
  ],

  achievements: [
    {
      // A valid award with a key the schema does not know: parsed and stripped.
      _id: "achievement-alpha-complete",
      _type: "achievement",
      name: "Alpha Graduate",
      description: "Complete the Alpha course",
      icon: "graduation-cap",
      glyph: "A+",
      category: "progress",
      solTier: false,
      xpReward: 50,
      award: { kind: "course-completed", course: "course-alpha", note: "x" },
    },
    {
      _id: "achievement-shelf",
      _type: "achievement",
      name: "Shelf Walker",
      description: "Finish every course on the shelf",
      icon: "map",
      glyph: "◆",
      category: "special",
      solTier: true,
      xpReward: 100,
      award: { kind: "path-completed", path: "path-shelf" },
    },
    {
      // No glyph, solTier or xpReward: the projection's defaults apply.
      _id: "achievement-early-bird",
      _type: "achievement",
      name: "Early Bird",
      description: "Awarded by hand",
      icon: "sunrise",
      category: "special",
      award: { kind: "manual" },
    },
    {
      // An award the schema rejects projects as null, so it never auto-fires.
      _id: "achievement-broken",
      _type: "achievement",
      name: "Broken",
      description: "Unknown award kind",
      icon: "x",
      glyph: "??",
      category: "special",
      solTier: false,
      xpReward: 0,
      award: { kind: "not-a-kind" },
    },
  ],

  quests: [
    {
      _id: "quest-lesson",
      _type: "quest",
      active: true,
      name: "Complete a Lesson",
      description: "Finish any lesson today",
      icon: "BookOpen",
      type: "lesson",
      xpReward: 20,
      targetValue: 1,
      resetType: "daily",
    },
    {
      // No description or icon: the projection's defaults apply.
      _id: "quest-streak",
      _type: "quest",
      active: true,
      name: "Keep the Streak",
      type: "streak",
      xpReward: 50,
      targetValue: 7,
      resetType: "weekly",
    },
    {
      _id: "quest-challenge",
      _type: "quest",
      active: false,
      name: "Complete a Challenge",
      type: "challenge",
      xpReward: 35,
      targetValue: 1,
      resetType: "daily",
    },
    {
      _id: "drafts.quest-lesson",
      _type: "quest",
      active: true,
      name: "Complete a Lesson (draft)",
      type: "lesson",
      xpReward: 20,
      targetValue: 1,
      resetType: "daily",
    },
  ],

  paths: [
    {
      _id: "path-shelf",
      _type: "learningPath",
      title: "Comece aqui",
      description: "Os primeiros passos.",
      slug: "comece-aqui",
      tag: "Fundamentos",
      order: 1,
      difficulty: "beginner",
      draft: false,
      retired: false,
      courses: [ref("course-alpha"), ref("course-beta")],
    },
    {
      // No slug, tag, order or difficulty.
      _id: "path-bare",
      _type: "learningPath",
      title: "Bare",
      courses: [ref("course-beta")],
    },
    {
      _id: "path-retired",
      _type: "learningPath",
      title: "First Steps",
      order: 99,
      retired: true,
      courses: [ref("course-alpha")],
    },
  ],

  slots: {
    "course-alpha": {
      version: 1,
      slots: {
        "lesson-alpha-quiz": 0,
        "lesson-alpha-code": 2,
        "lesson-alpha-deploy": 3,
      },
      retired: [1],
      next: 4,
    },
    "course-beta": {
      version: 1,
      slots: { "lesson-beta-parsons": 0 },
      retired: [],
      next: 1,
    },
  },

  l10n: {
    "course-alpha": {
      en: {
        course: {
          title: "Alpha: from thesis to your first asset",
          thumbnail: image("c"),
          modules: { fundamentos: { title: "Fundamentals" } },
        },
        lessons: {
          "lesson-alpha-quiz": {
            title: "Hash everything",
            blocks: {
              intro: {
                src: `# Hash everything\n\n![Diagram](${image("d")})\n\nA hash is a fingerprint.`,
              },
              check: {
                questions: {
                  q1: {
                    prompt: "What changes when one input byte changes?",
                    options: { b: { label: "The whole hash" } },
                  },
                },
              },
            },
          },
          "lesson-alpha-code": {
            blocks: {
              exercise: {
                hints: { "1": "Return the next id." },
                tests: { t1: { failureMessage: "Start from cursor + 1." } },
              },
            },
          },
        },
      },
    },
  },
};
