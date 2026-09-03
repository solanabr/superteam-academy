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
//  - deploy-quest flag (academy-courses#36, 2026-08-11): the b2s
//    `your-first-solana-program` ping-program code block gains
//    `deployable: true` — the lesson promises a devnet deploy and shipped
//    without the flag, so the deploy panel never mounted. Fixtures carry the
//    flipped flag in course-by-slug.json and lessons.json.
//  - authored → derived `tags` (#466 C3): course `tags` is no longer authored
//    content: it's the sorted, deduplicated union of the course's lessons'
//    `skills`. The fixtures carry the DERIVED tags computed from each course's
//    real lesson `skills`, not the original authored (now-retired) tag list.
//  - launch-catalog activation (issue #559): the bump to academy-courses
//    @012cd03d adds course 5 (`course-stablecoin-payments`, 9 lessons / 3
//    modules) and retargets `achievement-full-stack-solana` from
//    `path-solana-core` to `path-zero-to-deployed`, and course 4's capstone
//    `lesson-bfsp-m4-capstone` swaps its held-DeFi "What's Next" pointer for
//    the Superteam Earn terminus. This content never existed in the pre-flip
//    Sanity capture, so for these docs the golden = the projected bundle (the
//    committed bundle is the post-SP2 source of truth); every pre-existing
//    doc still matches the original prod-Sanity capture unchanged.
//  - launch-content wave 2 (bump to academy-courses @e1190680): retrieval
//    closes across the flagship spine (academy-courses #11, 28 quiz blocks
//    keyed `retrieval-close`), item-52b factual fixes (#9: faucet rate-limit
//    mechanism, Token-2022 maturity row deleted), challenge tutorNotes (#10),
//    and reviewExempt skill markers (#8). lessons.json and course-by-slug.json
//    were regenerated from the bundle through the real projectors for the
//    affected docs; all other fixtures untouched.
//  - launch-content wave 3 (bump to academy-courses @1b74e4a6): C2
//    `rust-for-program-devs` lands (academy-courses #12: +1 course, +14
//    lessons, new challenge/module entries in quests-raw's derived fields —
//    staged, not on-chain, so it stays hidden until owner course-creation),
//    tutorNotes on the two CARRY deploy-path challenges (#14), C5 + template
//    quiz explanations (#15). courses.json, lessons.json and quests-raw.json's
//    challengeLessonIds/moduleLessonMap regenerated from the bundle through
//    the real projectors (order preserved, raw quest docs untouched).
//  - launch-content wave 4 RE-LAND (bump to academy-courses @7a49747): C3
//    transform of the LIVE flagship course (16 -> 15 lessons; retired slots
//    0/2/11/14 burned, new slots 16-18; SPARSE slot map). First attempt #740
//    was reverted (#744) because the completion path derived bitmap indices
//    from array position; re-landed only after #751 made every on-chain path
//    slot-aware. courses/lessons/quests-raw-derived/paths/course-summaries
//    regenerated through the real projectors.
//  - launch-content wave 5 (bump to academy-courses @6d352db): C4
//    `dapp-and-sdk-with-kit` lands (academy-courses #18: +1 course, +11 dense
//    lessons at slots 0-10, trackLevel 4 — completing the track-1 ladder 1..5;
//    staged, not on-chain, hidden until owner course-creation). courses.json,
//    lessons.json and quests-raw's challengeLessonIds/moduleLessonMap
//    regenerated from the bundle through the real projectors (existing doc
//    order preserved, raw quest docs untouched).
//  - catalog finalization (academy-courses #21, wave 5): the 5 superseded
//    courses DELETED from content (already deactivated on-chain) — bundle is
//    now the live 4-course ladder (C2/C3/C4/C5, 49 lessons); zero-to-deployed
//    rewired to that ladder; frontend path retired (draft/empty); the
//    full-blocks course-by-slug fixture RETARGETED anchor-framework -> C3;
//    3 achievement awards retargeted (anchor-expert -> C3, rust-rookie -> C2,
//    course-completer -> C2 pending C1 (#673)). courses/lessons/paths/summaries/
//    quests-raw-derived regenerated; achievements-raw patched for the 3
//    retargets only (rest stays the prod-Sanity capture).
//  - C1 + EVM elective wave (bump to academy-courses @c5c625e0, PRs #22/#23/
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
//    (#848 / academy-courses #26) rewrite 4 openEnded prompts across C4/C5
//    (3 dsk milestones widen 60 -> 120 words; C5's terminus block re-keys
//    `submit` -> `reflect` and widens 200 -> 250) so no prompt is URL-only.
//    C4 code stand-ins fixed for inverted deposit account order (#22), which
//    also touches lesson-dsk-idl-to-typed-client / -wrap-the-generated-client.
//    courses/lessons/paths/summaries/quests-raw-derived regenerated from the
//    bundle through the real projectors (existing doc order preserved, new
//    docs appended, raw quest docs untouched); achievements-raw patched for
//    the course-completer retarget + the full-stack description only.
//  - skills sweep + defect batch (bump to academy-courses @23e4d1bf,
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
//  - public-alpha activation (bump to academy-courses @7c5ab3a7): the LARGEST
//    removal wave so far. The whole track-1 catalog (C1-C5, the EVM elective,
//    `path-zero-to-deployed` and the six unpopulated legacy paths) moves to
//    `_draft/`, which the compiler excludes (#978), and the alpha catalog takes
//    its place: 2 courses (`course-btc-to-sol-evolution` EN 15 lessons,
//    `course-solana-speedrun` PT-BR 4 lessons), 1 path (`path-first-steps`,
//    those 2 as members), 19 lessons, 7 achievements, 5 quests, 8 skills.
//    courses/course-by-slug/lessons/paths/summaries/quests-raw-derived were
//    REGENERATED through the real projectors over the new bundle; the
//    full-blocks course-by-slug fixture retargeted C3 -> the alpha flagship
//    `course-btc-to-sol-evolution`. achievements-raw was PATCHED, not
//    regenerated: `all`/`deployed` keep only the 7 live docs and
//    `achievement-course-completer` retargets C1 -> the alpha flagship. That
//    patch also drops the last two docs of the original prod-Sanity capture
//    that never existed in the bundle (`achievement-perfect-score`,
//    `achievement-speed-runner`), so the fixture is now an exact
//    both-directions cover of the bundle and the KNOWN_ABSENT divergence
//    ledger retires with them. anchor-expert is parked, so the award-shape
//    assertion moved to a live `course-completed` achievement.
//  - course banners (bump to academy-courses @94b2b89, academy-courses #35):
//    both alpha courses gain a course-level `assets/banner.webp` referenced by
//    the `thumbnail:` key the schema has always accepted, so `thumbnail` stops
//    projecting as null and the catalogue card stops falling back to
//    /cover.png (#1007). The same upstream commit corrects `duration` to its
//    documented unit (hours): btc-to-sol 15 -> 18 (15 was the lesson count),
//    speedrun 4 -> 0.25 (~15 min). An EDITS-ONLY wave otherwise — counts,
//    slots, ids and blocks are all unchanged. courses/course-by-slug/paths/
//    summaries regenerated through the real projectors; lessons.json,
//    quests-raw.json and achievements-raw.json are byte-unchanged (no lesson,
//    block or award moved).
//  - Pílula Solana & Superteam (bump to academy-courses @2c2241d1,
//    academy-courses #37): a new PT-BR single-lesson booth elective
//    (`course-pilula-solana-superteam`, 1 module `pilula`, lesson
//    `lesson-psp-solana-em-2-minutos`, 4 prose beats + 4-question quiz,
//    duration 0.03h). This content never existed in the pre-flip capture, so
//    per the launch-catalog precedent its golden = the projected bundle:
//    courses.json and lessons.json gained the projector-generated docs and
//    quests-raw.json's moduleLessonMap gained the one-module entry. Every
//    pre-existing doc is byte-unchanged.
//  - Forge College pilot (bump to academy-courses @4a6e4c6): a PT-BR
//    single-module course (`course-visao-geral-solana`, 3 lessons, module
//    `origens-e-historia`) authored under its OWN creator wallet
//    (`Em8D6Xyu…`), which is why the creator assertion is now a per-course
//    map instead of one constant. The same bump carries `creatorRewardXp: 30`
//    on the two Kaue courses — invisible here, `projectCourse` never projected
//    that field — and the upstream images arrive pre-compressed, so no asset
//    url moves. New content again = golden is the projected bundle:
//    courses.json and lessons.json gained the projector-generated docs and
//    quests-raw.json's moduleLessonMap gained the one-module entry. Every
//    pre-existing doc is byte-unchanged.
//  - gamification ladder (bump to academy-courses @958e7877, academy-courses
//    #41): an achievements+quests-ONLY wave — no course, lesson, path or slot
//    moved, so courses/lessons/paths/summaries/course-by-slug and quests-raw's
//    derived fields are all byte-unchanged. achievements 7 -> 24: 17 new docs
//    (streak/lessons-completed ladders, the three per-course badges, the
//    first-steps path badge, three community-stat badges) plus 4 repricings
//    (first-steps 50 -> 25, week-warrior 100 -> 75, monthly-master 300 -> 200,
//    consistency-king 500 -> 400) and `achievement-early-adopter` flipping
//    `user-number lte:100` -> `manual`, so it no longer auto-fires on signup.
//    The fixture stays the exact both-directions cover, regenerated into the
//    raw capture's null-filled award shape. quests-raw's `quests` array is the
//    ACTIVE set, so `quest-challenge` (active: false now) DROPS out of it,
//    and complete-lesson 25 -> 20 / lesson-batch 3 -> 2 targets at 50 -> 40 /
//    login-streak 40 -> 50 land in the remaining four.
//  - course-badge trim (bump to academy-courses @aff33b8d, academy-courses
//    #42): owner ruling — no course-specific achievements except speedrunner.
//    achievements 24 -> 18: pilula-taken, panorama, evolution-explorer,
//    evolution-navigator, evolution-scholar and the legacy course-completer
//    (which duplicated evolution-scholar's trigger) all deleted; the fixture
//    drops the same six from both arrays. Nothing else in the bundle moved.
//    The award-shape assertion moves course-completer -> speedrunner, now the
//    bundle's only `course-completed` doc.
//  - visao-geral completion (bump to academy-courses @8f40db93, academy-courses
//    #45): the Forge College pilot grows 3 -> 16 lessons across 4 modules.
//    Slots are APPEND-ONLY — the pilot keeps 0/1/2 and the 13 new lessons take
//    3-15 — so existing learners' on-chain progress bits stay valid (the #741
//    trap). The course record changes in place: duration 1.7 -> 7, xpReward
//    60 -> 320 (16 x 20), thumbnail banner.png -> banner.jpg, and tags widen
//    from solana-fundamentals alone to also cover transactions, account-model
//    and rpc-reads. The 3 pilot lessons are rewritten too (raw HTML converted
//    to Markdown, text unchanged), which is the 48 deletions in lessons.json.
//    No other course moved. quests-raw's moduleLessonMap gains the 3 new
//    modules; challengeLessonIds is unchanged (the course has no challenges).
//  - content i18n + WebP wave (bump to academy-courses @8371d7e9, academy-
//    courses #47/#51/#52): every course.yaml now declares `sourceLocale`
//    (three PT-BR originals, one EN) and the compiler stamps it on the raw
//    course doc — `projectCourse` does NOT project it (only the locale-aware
//    query path attaches locale fields, and only when asked), so courses.json
//    is byte-unchanged. #52 converts every published PNG to WebP, which
//    rewrites the image urls inside prose blocks — that is the whole
//    lessons.json + course-by-slug.json delta, plus #47's repaired adoption
//    visual in solana-speedrun. Counts unchanged (4 courses / 36 lessons).
//    No course ships an `l10n/` overlay at this SHA, so l10n.json is `{}`
//    and the localized-projection path is covered by queries-l10n.test.ts
//    against a fixture rather than by a golden.
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

  // Each course is authored under its own creator wallet, not the platform
  // authority the track-1 courses carried. The alpha catalog and the Pílula
  // booth elective share Kaue's wallet; the Forge College pilot has its own.
  const EXPECTED_CREATOR: Record<string, string> = {
    "course-btc-to-sol-evolution":
      "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ",
    "course-solana-speedrun": "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ",
    "course-pilula-solana-superteam":
      "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ",
    "course-visao-geral-solana": "Em8D6XyuXvNUK1YgLKBaji7HbbrZZq7fCdq3sGMXqxVZ",
  };

  it("creator is a real wallet (#399/B3); thumbnail is a compiled banner url", () => {
    //
    // `thumbnail` was null for every course until the banner wave (#1007) —
    // not by projector design, but because no pinned content had ever set the
    // field. It is asserted positively now so the catalogue cannot silently
    // regress to the /cover.png placeholder: a null here means the pinned
    // content lost its artwork, which is invisible in a byte-identical
    // comparison against a golden that was regenerated from that same content.
    for (const golden of goldenCourses) {
      const c = projectCourse(bundleCourse(golden._id), deps);
      expect(c.creator).toBe(EXPECTED_CREATOR[golden._id]);
      expect(c.thumbnail).toMatch(/^\/content-assets\/[\w-]+\/[\w.-]+$/);
    }
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
  // The alpha wave trimmed the fixture to exactly the bundle's live docs (see
  // the header note), so coverage is now an equality in BOTH directions: no
  // golden without a bundle doc, no bundle doc without a golden. Every doc must
  // then project identically (bundle doc == prod GROQ doc through the real
  // projector).
  it("bundle and golden cover exactly the same achievements", () => {
    expect(new Set(achievementsById.keys())).toEqual(
      new Set(goldenAch.all.map((a) => a._id))
    );
  });

  it("projects each shared achievement identically to prod", () => {
    for (const raw of goldenAch.all) {
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

  it("award is validated + stripped; speedrunner = course-completed", () => {
    // Was anchor-expert, then course-completer; the trim wave deleted every
    // course-specific badge except speedrunner, so it now carries the bundle's
    // only `course-completed` award.
    const speedrunner = projectAchievement(
      achievementsById.get("achievement-speedrunner")!
    );
    expect(speedrunner.award).toEqual({
      kind: "course-completed",
      course: "course-solana-speedrun",
    });
    expect(speedrunner.solTier).toBe(false);
  });

  it("early-adopter is manual — it no longer auto-fires on signup", () => {
    // The ladder wave retired the `user-number lte:100` rule. Asserted
    // positively because the regression is silent: a doc that drifted back to
    // an auto rule would hand every early signup 500 XP on day one, and a
    // byte-identical comparison against a golden regenerated from that same
    // doc could never catch it.
    const early = projectAchievement(
      achievementsById.get("achievement-early-adopter")!
    );
    expect(early.award).toEqual({ kind: "manual" });
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
