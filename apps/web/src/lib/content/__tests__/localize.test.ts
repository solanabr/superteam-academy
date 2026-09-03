import { describe, it, expect } from "vitest";
import {
  availableLocales,
  localizeCourseDoc,
  localizeLessonDoc,
  localizedLessonMap,
  resolveCourseLocale,
} from "../localize";
import type { CourseDoc, LessonDoc } from "../types";
import type { L10nCourseBundle } from "../compile/l10n";

/**
 * The runtime merge is PER LEAF: a translated string replaces its source
 * string and nothing else moves. Untranslated leaves stay in the course's
 * own language — never English — and the things an overlay cannot carry
 * (ids, correct flags, solutions, expected outputs) are provably untouched.
 */

const slug = (current: string) => ({ _type: "slug" as const, current });

const course: CourseDoc = {
  _id: "course-demo",
  _type: "course",
  slug: slug("demo"),
  sourceLocale: "pt-BR",
  title: "Curso",
  description: "Descrição",
  thumbnail: "/content-assets/demo/banner.png",
  modules: [
    { key: "m1", title: "Módulo 1", description: "d1", lessons: [] },
    { key: "m2", title: "Módulo 2", lessons: [] },
  ],
};

const lesson: LessonDoc = {
  _id: "lesson-basics",
  _type: "lesson",
  slug: slug("basics"),
  title: "Fundamentos",
  blocks: [
    { _key: "intro", _type: "prose", src: "# Olá" },
    {
      _key: "check",
      _type: "quiz",
      questions: [
        {
          id: "q1",
          prompt: "Pergunta?",
          options: [
            { id: "a", label: "Sim", correct: true },
            { id: "b", label: "Não", correct: false, feedback: "Errado." },
          ],
          explanation: "Porque sim.",
        },
      ],
    },
    {
      _key: "ex",
      _type: "code",
      solution: "// segredo",
      hints: ["Dica um", "Dica dois", "Dica três"],
      tests: [
        { id: "t1", description: "soma", input: "1", expectedOutput: "2" },
        { id: "t2", description: "subtrai", input: "3", expectedOutput: "1" },
      ],
    },
  ],
};

const overlay: L10nCourseBundle = {
  course: {
    title: "Course",
    thumbnail: "/content-assets/demo/l10n/en/banner.png",
    modules: { m1: { title: "Module 1" } },
  },
  lessons: {
    "lesson-basics": {
      title: "Basics",
      blocks: {
        intro: { src: "# Hello" },
        check: {
          questions: {
            q1: { prompt: "Question?", options: { b: { feedback: "Wrong." } } },
          },
        },
        ex: {
          hints: { "1": "Hint two" },
          tests: { t2: { description: "subtracts" } },
        },
      },
    },
  },
};

describe("resolveCourseLocale / availableLocales", () => {
  const overlays = { en: overlay };
  it("answers in the requested language when the course has it, else in its source", () => {
    expect(resolveCourseLocale("en", "pt-BR", overlays)).toBe("en");
    expect(resolveCourseLocale("pt-BR", "pt-BR", overlays)).toBe("pt-BR");
    expect(resolveCourseLocale("es", "pt-BR", overlays)).toBe("pt-BR");
    expect(resolveCourseLocale(undefined, "pt-BR", overlays)).toBe("pt-BR");
    expect(resolveCourseLocale("en", "pt-BR", undefined)).toBe("pt-BR");
  });
  it("lists the source first, then every overlay", () => {
    expect(availableLocales("pt-BR", overlays)).toEqual(["pt-BR", "en"]);
    expect(availableLocales("pt-BR", undefined)).toEqual(["pt-BR"]);
  });
});

describe("localizeCourseDoc", () => {
  it("replaces only the leaves the overlay carries", () => {
    const out = localizeCourseDoc(course, overlay);
    expect(out.title).toBe("Course");
    expect(out.description).toBe("Descrição"); // untranslated → source
    expect(out.thumbnail).toBe("/content-assets/demo/l10n/en/banner.png");
    const modules = out.modules as {
      key: string;
      title: string;
      description?: string;
    }[];
    expect(modules[0]).toMatchObject({
      key: "m1",
      title: "Module 1",
      description: "d1",
    });
    expect(modules[1]).toMatchObject({ key: "m2", title: "Módulo 2" });
  });
  it("is the identity without an overlay", () => {
    expect(localizeCourseDoc(course, undefined)).toBe(course);
  });
});

describe("localizeLessonDoc", () => {
  const out = localizeLessonDoc(lesson, overlay.lessons!["lesson-basics"]);
  const block = (key: string) =>
    (out.blocks as { _key: string; [k: string]: unknown }[]).find(
      (b) => b._key === key
    )!;

  it("title and prose", () => {
    expect(out.title).toBe("Basics");
    expect(block("intro").src).toBe("# Hello");
  });

  it("quiz: prompt and one option's feedback, with ids and correct flags untouched", () => {
    const [q] = block("check").questions as {
      id: string;
      prompt: string;
      explanation: string;
      options: {
        id: string;
        label: string;
        correct: boolean;
        feedback?: string;
      }[];
    }[];
    expect(q!.prompt).toBe("Question?");
    expect(q!.explanation).toBe("Porque sim."); // untranslated → source
    expect(q!.options).toEqual([
      { id: "a", label: "Sim", correct: true },
      { id: "b", label: "Não", correct: false, feedback: "Wrong." },
    ]);
  });

  it("code: sparse hint indices, test descriptions by id, solution and expected outputs untouched", () => {
    const ex = block("ex");
    expect(ex.hints).toEqual(["Dica um", "Hint two", "Dica três"]);
    expect(ex.solution).toBe("// segredo");
    expect(ex.tests).toEqual([
      { id: "t1", description: "soma", input: "1", expectedOutput: "2" },
      { id: "t2", description: "subtracts", input: "3", expectedOutput: "1" },
    ]);
  });

  it("does not mutate the source doc", () => {
    expect(lesson.title).toBe("Fundamentos");
    expect((lesson.blocks as { hints?: string[] }[])[2]!.hints).toEqual([
      "Dica um",
      "Dica dois",
      "Dica três",
    ]);
  });
});

describe("localizedLessonMap", () => {
  it("returns a view with the course's lessons localized and everything else passed through", () => {
    const other: LessonDoc = {
      _id: "lesson-other",
      _type: "lesson",
      slug: slug("o"),
      title: "Outra",
    };
    const base = new Map([
      [lesson._id, lesson],
      [other._id, other],
    ]);
    const view = localizedLessonMap(base, overlay);
    expect(view.get("lesson-basics")!.title).toBe("Basics");
    expect(view.get("lesson-other")).toBe(other);
    expect(localizedLessonMap(base, undefined)).toBe(base);
  });
});
