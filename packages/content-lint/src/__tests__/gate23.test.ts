import { describe, it, expect, vi } from "vitest";
import { buildModel } from "../checks/gate1-schema";
import {
  gate23Check,
  youtubeVideoId,
  type OembedStatus,
  type ProbeOembed,
} from "../checks/gate23-video-embeddable";
import { makeTempRepo } from "./helpers";

function modelFrom(tree: Record<string, string>) {
  return buildModel(makeTempRepo(tree), []);
}

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
sourceLocale: pt-BR
xpPerLesson: 10
xpReward: 100
modules:
  - key: m
    title: M
    lessons: [lesson-a]
`;

/** A lesson whose single block is a video at `url`. */
function videoLesson(name: string, url: string): Record<string, string> {
  return {
    [`courses/x/lessons/${name}/lesson.yaml`]: `id: lesson-${name}
slug: ${name}
title: ${name}
skills: [pdas]
blocks:
  - { key: video, type: video, url: "${url}" }
`,
  };
}

/** An English overlay that swaps the lesson's video for another id. */
function overlay(name: string, url: string): Record<string, string> {
  return {
    "courses/x/l10n/en/strings.yaml": `locale: en
lessons:
  ${name}:
    title: ${name} in English
    blocks:
      video:
        url: "${url}"
`,
  };
}

const PLAYS = "https://www.youtube.com/watch?v=L65KvCbTqRo";
const RESTRICTED = "https://www.youtube.com/watch?v=40KvouUtgbc";

/** A mock oembed: every id answers 200 unless listed as refused/unreachable. */
function oembed(
  opts: { refused?: Record<string, number>; unreachable?: string[] } = {}
): ProbeOembed {
  return async (id): Promise<OembedStatus> => {
    if (opts.unreachable?.includes(id)) {
      return { ok: false, kind: "unreachable" };
    }
    const status = opts.refused?.[id];
    if (status) return { ok: false, kind: "refused", status };
    return { ok: true };
  };
}

describe("youtubeVideoId", () => {
  it("reads every youtube url shape and ignores everything else", () => {
    expect(youtubeVideoId(PLAYS)).toBe("L65KvCbTqRo");
    expect(youtubeVideoId("https://youtu.be/L65KvCbTqRo")).toBe("L65KvCbTqRo");
    expect(youtubeVideoId("https://www.youtube.com/embed/L65KvCbTqRo")).toBe(
      "L65KvCbTqRo"
    );
    expect(youtubeVideoId("https://vimeo.com/123456")).toBeNull();
    expect(youtubeVideoId("nonsense")).toBeNull();
  });
});

describe("gate 23 — video embeddability", () => {
  it("warns (never errors) on a source video whose embedding is disabled", async () => {
    const model = modelFrom({
      "courses/x/course.yaml": course,
      ...videoLesson("a", RESTRICTED),
    });
    const ds = await gate23Check(model, {
      probe: oembed({ refused: { "40KvouUtgbc": 401 } }),
    });
    expect(ds).toHaveLength(1);
    expect(ds[0]?.gate).toBe("gate-23");
    expect(ds[0]?.severity).toBe("warning");
    expect(ds[0]?.file).toBe("courses/x/lessons/a/lesson.yaml");
    expect(ds[0]?.message).toContain(
      "video not embeddable (HTTP 401) — learners get the watch-on-YouTube card"
    );
    expect(ds[0]?.message).toContain('lesson "lesson-a"');
    expect(ds[0]?.message).toContain("locale source");
    expect(ds.some((d) => d.severity === "error")).toBe(false);
  });

  it("checks an l10n overlay's replacement url and names its locale", async () => {
    const model = modelFrom({
      "courses/x/course.yaml": course,
      ...videoLesson("a", PLAYS),
      ...overlay("a", RESTRICTED),
    });
    const ds = await gate23Check(model, {
      probe: oembed({ refused: { "40KvouUtgbc": 401 } }),
    });
    expect(ds).toHaveLength(1);
    expect(ds[0]?.file).toBe("courses/x/l10n/en/strings.yaml");
    expect(ds[0]?.message).toContain('lesson "a"');
    expect(ds[0]?.message).toContain("locale en");
  });

  it("treats 403 and 404 as refusals too", async () => {
    for (const status of [403, 404]) {
      const model = modelFrom({
        "courses/x/course.yaml": course,
        ...videoLesson("a", RESTRICTED),
      });
      const ds = await gate23Check(model, {
        probe: oembed({ refused: { "40KvouUtgbc": status } }),
      });
      expect(ds[0]?.message).toContain(`HTTP ${status}`);
      expect(ds[0]?.severity).toBe("warning");
    }
  });

  it("is silent when every video embeds", async () => {
    const model = modelFrom({
      "courses/x/course.yaml": course,
      ...videoLesson("a", PLAYS),
      ...overlay("a", PLAYS),
    });
    expect(await gate23Check(model, { probe: oembed() })).toEqual([]);
  });

  it("degrades an unreachable oembed to ONE notice, not a warning", async () => {
    const model = modelFrom({
      "courses/x/course.yaml": course,
      ...videoLesson("a", RESTRICTED),
      ...overlay("a", RESTRICTED),
    });
    const ds = await gate23Check(model, {
      probe: oembed({ unreachable: ["40KvouUtgbc"] }),
    });
    expect(ds).toHaveLength(1);
    expect(ds[0]?.severity).toBe("notice");
    expect(ds[0]?.message).toContain("YouTube oembed unreachable for 1 video");
    expect(ds.some((d) => d.severity === "warning")).toBe(false);
  });

  it("a probe that throws is unreachable, not a failure", async () => {
    const model = modelFrom({
      "courses/x/course.yaml": course,
      ...videoLesson("a", RESTRICTED),
    });
    const ds = await gate23Check(model, {
      probe: async () => {
        throw new Error("ETIMEDOUT");
      },
    });
    expect(ds).toHaveLength(1);
    expect(ds[0]?.severity).toBe("notice");
  });

  it("probes each id once and makes no call at all without videos", async () => {
    const probe = vi.fn(oembed({ refused: { "40KvouUtgbc": 401 } }));
    const shared = modelFrom({
      "courses/x/course.yaml": course,
      ...videoLesson("a", RESTRICTED),
      ...videoLesson("b", RESTRICTED),
      ...overlay("a", RESTRICTED),
    });
    const ds = await gate23Check(shared, { probe });
    // Three authored occurrences, one network call, three warnings.
    expect(probe).toHaveBeenCalledTimes(1);
    expect(ds.filter((d) => d.severity === "warning")).toHaveLength(3);

    const noVideos = modelFrom({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": `id: lesson-a
slug: a
title: a
skills: [pdas]
blocks:
  - { key: intro, type: prose, src: intro.md }
`,
    });
    const probe2 = vi.fn(oembed());
    expect(await gate23Check(noVideos, { probe: probe2 })).toEqual([]);
    expect(probe2).not.toHaveBeenCalled();
  });

  it("ignores a non-YouTube video url", async () => {
    const model = modelFrom({
      "courses/x/course.yaml": course,
      ...videoLesson("a", "https://vimeo.com/123456"),
    });
    const probe = vi.fn(oembed());
    expect(await gate23Check(model, { probe })).toEqual([]);
    expect(probe).not.toHaveBeenCalled();
  });
});
