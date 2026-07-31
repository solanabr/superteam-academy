import { describe, it, expect, vi } from "vitest";
import {
  coursesById,
  lessonsById,
  achievementsById,
  questsById,
} from "../store";
import {
  projectCourse,
  projectLesson,
  projectAchievement,
  projectCourseSummary,
  projectRecommended,
  projectQuestData,
  projectLearningPath,
  countCourseLessons,
} from "../project";
import type { AchievementDoc, CourseDoc } from "../types";
import goldenCourses from "./fixtures/golden/courses.json";
import goldenCourseBySlug from "./fixtures/golden/course-by-slug.json";
import goldenLessons from "./fixtures/golden/lessons.json";
import goldenAch from "./fixtures/golden/achievements-raw.json";
import goldenQuests from "./fixtures/golden/quests-raw.json";
import goldenPaths from "./fixtures/golden/paths.json";
import goldenSummaries from "./fixtures/golden/course-summaries.json";

vi.mock("server-only", () => ({}));

// Golden fixtures (imported above) = a live capture of the PRE-FLIP GROQ output
// from prod Sanity (public dataset 4e3i2wwc/production). Each projector, fed the
// committed bundle doc, must deep-equal the captured GROQ shape. Divergences
// here mean the locked bundle SHA and prod Sanity have drifted (report, do not
// fudge the fixture) — EXCEPT the documented content-wave deltas below, hand-
// edited into the fixtures because the golden capture predates them:
//
//  - `instructor` → `creator` (issue #478): the retired instructor deref no
//    longer exists. RESOLVED by #399/B3 — every course now carries a real
//    `creator` wallet (see below), so the fixtures carry that wallet too, not
//    the original `null` placeholder.
//  - authored → derived `tags` (#466 C3): course `tags` is no longer authored
//    content: it's the sorted, deduplicated union of the course's lessons'
//    `skills`. The fixtures carry the DERIVED tags computed from each course's
//    real lesson `skills`, not the original authored (now-retired) tag list.
//  - launch-catalog activation (issue #559): the bump to courses-academy
//    @012cd03d adds course 5 (`course-stablecoin-payments`, 9 lessons / 3
//    modules) and retargets `achievement-full-stack-solana` from
//    `path-solana-core` to `path-zero-to-deployed`, and course 4's capstone
//    `lesson-bfsp-m4-capstone` swaps its held-DeFi "What's Next" pointer for
//    the Superteam Earn terminus. This content never existed in the pre-flip
//    Sanity capture, so for these docs the golden = the projected bundle (the
//    committed bundle is the post-SP2 source of truth); every pre-existing
//    doc still matches the original prod-Sanity capture unchanged.
//  - launch-content wave 2 (bump to courses-academy @e1190680): retrieval
//    closes across the flagship spine (courses-academy #11, 28 quiz blocks
//    keyed `retrieval-close`), item-52b factual fixes (#9: faucet rate-limit
//    mechanism, Token-2022 maturity row deleted), challenge tutorNotes (#10),
//    and reviewExempt skill markers (#8). lessons.json and course-by-slug.json
//    were regenerated from the bundle through the real projectors for the
//    affected docs; all other fixtures untouched.
//  - launch-content wave 3 (bump to courses-academy @1b74e4a6): C2
//    `rust-for-program-devs` lands (courses-academy #12: +1 course, +14
//    lessons, new challenge/module entries in quests-raw's derived fields —
//    staged, not on-chain, so it stays hidden until owner course-creation),
//    tutorNotes on the two CARRY deploy-path challenges (#14), C5 + template
//    quiz explanations (#15). courses.json, lessons.json and quests-raw.json's
//    challengeLessonIds/moduleLessonMap regenerated from the bundle through
//    the real projectors (order preserved, raw quest docs untouched).
//  - launch-content wave 4 RE-LAND (bump to courses-academy @7a49747): C3
//    transform of the LIVE flagship course (16 -> 15 lessons; retired slots
//    0/2/11/14 burned, new slots 16-18; SPARSE slot map). First attempt #740
//    was reverted (#744) because the completion path derived bitmap indices
//    from array position; re-landed only after #751 made every on-chain path
//    slot-aware. courses/lessons/quests-raw-derived/paths/course-summaries
//    regenerated through the real projectors.
//  - launch-content wave 5 (bump to courses-academy @6d352db): C4
//    `dapp-and-sdk-with-kit` lands (courses-academy #18: +1 course, +11 dense
//    lessons at slots 0-10, trackLevel 4 — completing the track-1 ladder 1..5;
//    staged, not on-chain, hidden until owner course-creation). courses.json,
//    lessons.json and quests-raw's challengeLessonIds/moduleLessonMap
//    regenerated from the bundle through the real projectors (existing doc
//    order preserved, raw quest docs untouched).
//  - catalog finalization (courses-academy #21, wave 5): the 5 superseded
//    courses DELETED from content (already deactivated on-chain) — bundle is
//    now the live 4-course ladder (C2/C3/C4/C5, 49 lessons); zero-to-deployed
//    rewired to that ladder; frontend path retired (draft/empty); the
//    full-blocks course-by-slug fixture RETARGETED anchor-framework -> C3;
//    3 achievement awards retargeted (anchor-expert -> C3, rust-rookie -> C2,
//    course-completer -> C2 pending C1 (#673)). courses/lessons/paths/summaries/
//    quests-raw-derived regenerated; achievements-raw patched for the 3
//    retargets only (rest stays the prod-Sanity capture).
//  - C1 + EVM elective wave (bump to courses-academy @c5c625e0, PRs #22/#23/
//    #24/#25/#26/#27): +2 courses / +17 lessons — C1 `course-solana-for-web-devs`
//    (8 lessons, trackLevel 1) and the off-ladder elective
//    `course-solana-for-evm-devs` (9 lessons, trackId 0). Bundle is now 6
//    courses / 66 lessons; BOTH new courses are staged-only (no on-chain
//    create, no deployment row) so the catalog gate keeps them invisible.
//    Flip-wave edits: `path-zero-to-deployed` gains C1 in the FRONT slot (the
//    ladder is now C1→C2→C3→C4→C5); `path-solana-core` order 1 -> 8 (order-1
//    collision, #23); `achievement-course-completer` retargeted C2 -> C1,
//    closing the #673 placeholder; `achievement-full-stack-solana` description
//    reworded to name the Zero to Deployed path. Comprehension reflections
//    (#848 / courses-academy #26) rewrite 4 openEnded prompts across C4/C5
//    (3 dsk milestones widen 60 -> 120 words; C5's terminus block re-keys
//    `submit` -> `reflect` and widens 200 -> 250) so no prompt is URL-only.
//    C4 code stand-ins fixed for inverted deposit account order (#22), which
//    also touches lesson-dsk-idl-to-typed-client / -wrap-the-generated-client.
//    courses/lessons/paths/summaries/quests-raw-derived regenerated from the
//    bundle through the real projectors (existing doc order preserved, new
//    docs appended, raw quest docs untouched); achievements-raw patched for
//    the course-completer retarget + the full-stack description only.
//  - skills sweep + defect batch (bump to courses-academy @23e4d1bf,
//    PRs #28/#29): an EDITS-ONLY wave — counts are UNCHANGED (6 courses / 66
//    lessons / 8 paths / 10 achievements / 5 quests), no doc added, removed or
//    re-keyed, no slot movement. The `skills.yaml` registry shrinks 83 -> 74
//    (7 dead entries deleted, `defi`+`amm`+`lending`+`staking`+`oracles`
//    consolidated away, `transfer-hook`/`wallet-adapter`/`siws`/`ci` dropped,
//    `rpc` RENAMED to `rpc-reads` including 2 C1 lesson retags) and 19 second-
//    use tags are added, which takes gate-19b to zero warnings and lets the
//    lint tier flip to error (#676). Note the lessons golden is UNAFFECTED by
//    retagging: `projectLesson` projects `_id/title/slug/blocks[]` only —
//    `skills` reaches the app through `getAllLessonSkills`, not this projector.
//    So of the 20 edited lesson docs only 6 move the golden (the ones whose
//    BLOCKS changed): C3 `lesson-bfsp-adding-instructions` gains a new
//    3-question quiz, C2 `lesson-rpd-what-you-built` grows its recap quiz
//    7 -> 25 questions, plus C4/C5 defect fixes (npm-stat repulls, pricing,
//    the payment-rails decision map and the terminus block). Course `tags` are
//    DERIVED from lesson skills, so 5 of 6 courses shift tags (C2's union is
//    unchanged — its recap picked up slugs already present on sibling lessons,
//    which is exactly what a second-use sweep produces); C5 also gets an opener
//    rewrite, its only non-tag course-field change. courses/lessons/
//    course-by-slug/paths/summaries regenerated through the real projectors;
//    quests-raw is byte-unchanged (no code block gained or lost) and
//    achievements-raw is untouched.
const deps = { lessonsById };

function bundleCourse(id: string): CourseDoc {
  const doc = coursesById.get(id);
  if (!doc) throw new Error(`bundle missing course ${id}`);
  return doc;
}

describe("projectCourse — getAllCourses shape (summary module lessons)", () => {
  it("every bundle course has a golden (bundle → golden coverage)", () => {
    expect(coursesById.size).toBe(goldenCourses.length);
  });

  it("projects every prod course byte-identically", () => {
    for (const golden of goldenCourses) {
      const projected = projectCourse(bundleCourse(golden._id), deps);
      expect(projected).toEqual(golden);
    }
  });

  it("creator is a real wallet (#399/B3); thumbnail is null (documented deltas)", () => {
    const c = projectCourse(bundleCourse(goldenCourses[0]!._id), deps);
    expect(c.creator).toBe("B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF");
    expect(c.thumbnail).toBeNull();
  });
});

describe("projectCourse — getCourseBySlug shape (full module lessons)", () => {
  it("projects the course with full blocks[] lessons byte-identically", () => {
    const projected = projectCourse(
      bundleCourse(goldenCourseBySlug._id),
      deps,
      {
        fullLessons: true,
      }
    );
    expect(projected).toEqual(goldenCourseBySlug);
  });

  it("attaches trackCollectionAddress only when supplied (getCourseById)", () => {
    const withAddr = projectCourse(bundleCourse(goldenCourseBySlug._id), deps, {
      trackCollectionAddress: "TrackColl111",
    });
    expect(withAddr.trackCollectionAddress).toBe("TrackColl111");
    const without = projectCourse(bundleCourse(goldenCourseBySlug._id), deps);
    expect("trackCollectionAddress" in without).toBe(false);
  });
});

describe("projectLesson — full blocks[] projection", () => {
  it("every bundle lesson has a golden (bundle → golden coverage)", () => {
    expect(lessonsById.size).toBe(goldenLessons.length);
  });

  it("projects every prod lesson byte-identically", () => {
    for (const golden of goldenLessons) {
      const doc = lessonsById.get(golden._id);
      expect(doc, `bundle missing lesson ${golden._id}`).toBeDefined();
      expect(projectLesson(doc!)).toEqual(golden);
    }
  });

  it("a code block carries solution + tests + all null-filled sibling keys", () => {
    const codeGolden = goldenLessons.find((l) =>
      l.blocks?.some((b) => b._type === "code")
    );
    expect(codeGolden).toBeDefined();
    const projected = projectLesson(lessonsById.get(codeGolden!._id)!);
    const cb = projected.blocks.find((b) => b._type === "code");
    expect(cb).toBeDefined();
    // solution/tests present, quiz-only fields null-filled
    expect((cb as unknown as { solution: string }).solution).toBeTruthy();
    expect(Array.isArray((cb as unknown as { tests: unknown }).tests)).toBe(
      true
    );
    expect((cb as unknown as { questions: unknown }).questions).toBeNull();
  });

  it("surfaces a test's failureMessage only when authored (#575)", () => {
    const projected = projectLesson({
      _id: "lesson-synthetic-575",
      title: "t",
      slug: { current: "s" },
      blocks: [
        {
          _key: "exercise",
          _type: "code",
          tests: [
            {
              id: "t1",
              description: "authored",
              input: "1",
              expectedOutput: "1",
              failureMessage: "Off by one — start the loop at 0.",
            },
            {
              id: "t2",
              description: "bare",
              input: "2",
              expectedOutput: "2",
            },
          ],
        },
      ],
    } as unknown as Parameters<typeof projectLesson>[0]);

    const tests = (
      projected.blocks[0] as unknown as { tests: Record<string, unknown>[] }
    ).tests;
    expect(tests[0]!.failureMessage).toBe("Off by one — start the loop at 0.");
    // Absent on the raw test → key omitted entirely (byte-identical to golden),
    // not present-as-null like the frozen-capture siblings.
    expect("failureMessage" in tests[1]!).toBe(false);
  });
});

describe("projectAchievement — mapAchievement over the bundle", () => {
  // Prod Sanity carries 12 achievements; the locked bundle carries 10. The two
  // extra prod docs (award:null / admin-granted) are absent from the bundle.
  // Documented divergence — see report. Every SHARED achievement must project
  // identically (bundle doc == prod GROQ doc through the real projector).
  const KNOWN_ABSENT = new Set([
    "achievement-perfect-score",
    "achievement-speed-runner",
  ]);

  it("bundle covers exactly the shared 10; prod's extra 2 are the known set", () => {
    const bundleIds = new Set(achievementsById.keys());
    const missing = goldenAch.all
      .map((a) => a._id)
      .filter((id) => !bundleIds.has(id));
    expect(new Set(missing)).toEqual(KNOWN_ABSENT);
  });

  it("projects each shared achievement identically to prod", () => {
    for (const raw of goldenAch.all) {
      if (KNOWN_ABSENT.has(raw._id)) continue;
      const doc = achievementsById.get(raw._id);
      expect(doc, `bundle missing achievement ${raw._id}`).toBeDefined();
      // Project the bundle doc AND the prod GROQ raw doc through the same
      // projector: equal output proves the underlying content matches. The raw
      // GROQ doc omits `_type` (projectAchievement never reads it).
      expect(projectAchievement(doc!)).toEqual(
        projectAchievement(raw as unknown as AchievementDoc)
      );
    }
  });

  it("award is validated + stripped; anchor-expert = course-completed", () => {
    const anchor = projectAchievement(
      achievementsById.get("achievement-anchor-expert")!
    );
    expect(anchor.award).toEqual({
      kind: "course-completed",
      // Retargeted from course-anchor-framework in the catalog finalization
      // (courses-academy #21): the Anchor prose merged into C3.
      course: "course-building-first-program",
    });
    expect(anchor.glyph).toBe("⬡");
    expect(anchor.solTier).toBe(false);
  });
});

describe("projectQuestData — active quests, challenge lessons, module map", () => {
  // Reference transform = the exact getAllQuests JS over the prod GROQ raw.
  const ref = {
    quests: goldenQuests.quests.map((q) => ({
      id: q._id,
      name: q.name,
      description: q.description ?? "",
      type: q.type,
      icon: q.icon ?? "CircleDashed",
      xpReward: q.xpReward,
      targetValue: q.targetValue,
      resetType: q.resetType,
    })),
    challengeLessonIds: (goldenQuests.challengeLessonIds ?? []).filter(Boolean),
    moduleLessonMap: (goldenQuests.moduleLessonMap ?? [])
      .filter((m) => !!m && !!m.lessonIds && m.lessonIds.length > 0)
      .map((m) => ({
        id: m!._id ?? "",
        lessonIds: m!.lessonIds.filter((x): x is string => !!x),
      })),
  };

  const projected = projectQuestData(
    [...questsById.values()],
    [...lessonsById.values()],
    [...coursesById.values()]
  );

  // Order across quests / challengeLessonIds / modules is not contractual (the
  // consumer looks up by id), and GROQ doc order != bundle array order, so
  // compare order-insensitively. lessonIds order WITHIN a module is display
  // order and IS preserved on both sides.
  const byId = <T extends { id: string }>(a: T, b: T) =>
    a.id.localeCompare(b.id);

  it("active quests match prod (order-insensitive)", () => {
    expect([...projected.quests].sort(byId)).toEqual(
      [...ref.quests].sort(byId)
    );
  });

  it("challengeLessonIds match prod (as a set)", () => {
    expect(new Set(projected.challengeLessonIds)).toEqual(
      new Set(ref.challengeLessonIds)
    );
    expect(projected.challengeLessonIds).toHaveLength(
      ref.challengeLessonIds.length
    );
  });

  it("moduleLessonMap matches prod (order-insensitive, lessonIds ordered)", () => {
    expect([...projected.moduleLessonMap].sort(byId)).toEqual(
      [...ref.moduleLessonMap].sort(byId)
    );
  });
});

describe("projectLearningPath — getAllLearningPaths shape", () => {
  it("projects every prod path byte-identically (members from bundle)", () => {
    for (const golden of goldenPaths) {
      const memberCourses = golden.courses.map((c) => bundleCourse(c._id));
      const projected = projectLearningPath(golden, memberCourses, deps);
      expect(projected).toEqual(golden);
    }
  });
});

describe("projectCourseSummary / projectRecommended / countCourseLessons", () => {
  it("projectCourseSummary matches getCoursesByIds", () => {
    for (const golden of goldenSummaries.coursesByIds) {
      const projected = projectCourseSummary(
        bundleCourse(golden._id),
        golden.learningPath
      );
      expect(projected).toEqual(golden);
    }
  });

  it("projectRecommended matches getRecommendedCourses", () => {
    for (const golden of goldenSummaries.recommended) {
      const projected = projectRecommended(
        bundleCourse(golden._id),
        golden.learningPath
      );
      expect(projected).toEqual(golden);
    }
  });

  it("countCourseLessons matches count(modules[].lessons[])", () => {
    for (const golden of goldenSummaries.lessonCounts) {
      expect(countCourseLessons(bundleCourse(golden._id))).toBe(
        golden.totalLessons
      );
    }
  });
});
