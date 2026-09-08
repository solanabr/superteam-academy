/* eslint-disable import/order -- vi.mock factories are hoisted above imports;
   `server-only` and the env module must both be stubbed before the graph loads. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { gzipSync } from "node:zlib";
import { stringify } from "yaml";

vi.mock("server-only", () => ({}));

const env = vi.hoisted(() => ({
  serverEnv: { GITHUB_TOKEN: undefined as string | undefined },
}));
vi.mock("@/lib/env.server", () => env);

import { compilePrPreview } from "../preview-compile";
import {
  findPreviewCourse,
  findPreviewLesson,
  previewCourseLessons,
  type PreviewBundle,
} from "../preview-store";
import { makeTar, PNG_1X1 } from "@/lib/content/compile/__tests__/_fixtures";

/**
 * The teacher preview must let a teacher check BOTH halves of a bilingual PR
 * before it is published. It compiles the PR in memory and used to project
 * the raw source docs straight away, dropping the `l10n.json` the compiler
 * had just produced — so every previewed course rendered in its source
 * language whatever the UI locale, and never showed the language notice.
 * These pin the preview to the live site's rule: the UI locale when the
 * course ships it, the source otherwise, with the locale fields attached.
 */

const SHA = "e".repeat(40);
const PR = 34;

/** A PT-BR course with an EN overlay: strings, translated prose, a localized image. */
function bilingualTarball(): Uint8Array {
  const top = `solanabr-academy-courses-${SHA}`;
  const course = `${top}/courses/demo`;
  const lesson = `${course}/lessons/basics`;
  const en = `${course}/l10n/en`;
  const files: Record<string, string | Uint8Array> = {
    [`${top}/skills.yaml`]: "- slug: pdas\n  label: PDAs\n",
    [`${course}/course.yaml`]: stringify({
      id: "course-demo",
      slug: "demo",
      sourceLocale: "pt-BR",
      title: "Curso Demo",
      description: "Descrição",
      difficulty: "beginner",
      duration: 1,
      xpPerLesson: 10,
      xpReward: 100,
      modules: [{ key: "m", title: "Módulo", lessons: ["lesson-basics"] }],
    }),
    [`${course}/slots.lock.json`]: JSON.stringify({
      version: 1,
      slots: { "lesson-basics": 0 },
      retired: [],
      next: 1,
    }),
    [`${lesson}/lesson.yaml`]: stringify({
      id: "lesson-basics",
      slug: "basics",
      title: "Fundamentos",
      skills: ["pdas"],
      blocks: [
        { key: "intro", type: "prose", src: "intro.md" },
        { key: "reflect", type: "openEnded", prompt: "O que aprendeu?" },
      ],
    }),
    [`${lesson}/intro.md`]: "# Olá\n\n![d](assets/d.png)\n",
    [`${lesson}/assets/d.png`]: new Uint8Array(PNG_1X1),
    [`${en}/strings.yaml`]: stringify({
      locale: "en",
      course: { title: "Demo Course", modules: { m: { title: "Module" } } },
      lessons: {
        basics: {
          title: "Basics",
          blocks: { reflect: { prompt: "What did you learn?" } },
        },
      },
    }),
    [`${en}/lessons/basics/intro.md`]: "# Hello\n\n![d](assets/d.png)\n",
    [`${en}/lessons/basics/assets/d.png`]: new Uint8Array(PNG_1X1),
  };
  return gzipSync(Buffer.from(makeTar(files)));
}

function stubGitHub(): void {
  const tarball = bilingualTarball();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              head: { sha: SHA, ref: "feat/en" },
              title: "Add an English translation",
              state: "open",
              user: { login: "someone" },
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          )
        )
      )
      .mockImplementationOnce(() =>
        Promise.resolve(new Response(new Uint8Array(tarball), { status: 200 }))
      )
      .mockImplementation(() =>
        Promise.resolve(
          new Response("[]", {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        )
      )
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function compiled(): Promise<PreviewBundle> {
  stubGitHub();
  const r = await compilePrPreview(PR);
  return r as unknown as PreviewBundle;
}

describe("teacher preview in the reader's language", () => {
  it("keeps the PR's overlay, with its urls pointed at the preview asset route", async () => {
    const b = await compiled();
    const en = b.l10n["course-demo"]!.en!;
    expect(en.course?.title).toBe("Demo Course");
    // The localized image lives under the preview route, like every other asset.
    expect(en.lessons!["lesson-basics"]!.blocks!.intro!.src).toContain(
      `(/api/teach/preview/${PR}/assets/demo/l10n/en/basics/d.png)`
    );
    expect(b.assets.has("demo/l10n/en/basics/d.png")).toBe(true);
  });

  it("labels each listed course with the languages the PR ships", async () => {
    const b = await compiled();
    expect(b.courses[0]).toMatchObject({
      title: "Curso Demo", // the listing stays in the source language
      sourceLocale: "pt-BR",
      availableLocales: ["pt-BR", "en"],
    });
  });

  it("projects the course page in the UI locale when the PR ships it", async () => {
    const b = await compiled();
    const en = findPreviewCourse(b, "demo", "en")!;
    expect(en.title).toBe("Demo Course");
    expect(en.description).toBe("Descrição"); // untranslated leaf → source
    expect(en.modules[0]!.title).toBe("Module");
    expect(en.modules[0]!.lessons[0]!.title).toBe("Basics");
    expect(en).toMatchObject({
      sourceLocale: "pt-BR",
      availableLocales: ["pt-BR", "en"],
      locale: "en",
    });
  });

  it("falls back to the source language, and says so, for a locale the PR lacks", async () => {
    const b = await compiled();
    const es = findPreviewCourse(b, "demo", "es")!;
    expect(es.title).toBe("Curso Demo");
    expect(es.locale).toBe("pt-BR"); // ≠ requested → the notice renders
    const pt = findPreviewCourse(b, "demo", "pt-BR")!;
    expect(pt.locale).toBe("pt-BR");
    expect(findPreviewCourse(b, "nope", "en")).toBeNull();
  });

  it("the lesson page reads from the SAME localized course, so the body and the lesson list agree", async () => {
    const b = await compiled();
    const en = findPreviewCourse(b, "demo", "en")!;
    const lesson = findPreviewLesson(en, "basics")!;
    expect(lesson.title).toBe("Basics");
    const [intro, reflect] = lesson.blocks as unknown as [
      { src: string },
      { prompt: string },
    ];
    expect(intro.src).toContain("# Hello");
    expect(reflect.prompt).toBe("What did you learn?");
    expect(previewCourseLessons(en).map((l) => l.title)).toEqual(["Basics"]);

    const pt = findPreviewCourse(b, "demo", "pt-BR")!;
    expect(findPreviewLesson(pt, "basics")!.title).toBe("Fundamentos");
    expect(findPreviewLesson(pt, "nope")).toBeNull();
  });
});
