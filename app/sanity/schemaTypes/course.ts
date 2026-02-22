import { defineType, defineField } from "sanity";

export const course = defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    // ── Content / Display ────────────────────────────────────────────────────
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "courseId",
      title: "Course ID / Slug",
      type: "slug",
      description:
        "Used as both the URL path (/courses/[slug]) and the on-chain Course ID (PDA seed). " +
        "Max 32 characters — keep it short and stable (changing it after on-chain registration breaks enrollments).",
      validation: (r) =>
        r.required().custom((slug) => {
          const current = (slug as { current?: string })?.current ?? "";
          if (current.length > 32) return `Course ID must be 32 characters or fewer (on-chain seed limit). Currently ${current.length} chars.`;
          return true;
        }),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "longDescription",
      title: "Long Description",
      type: "text",
      rows: 6,
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      options: { hotspot: true },
      description: "Use a 16:9 image — recommended minimum 1280×720px. The app crops to 16:9 automatically.",
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: { list: ["beginner", "intermediate", "advanced"] },
    }),
    defineField({
      name: "track",
      title: "Track",
      type: "reference",
      to: [{ type: "track" }],
    }),
    defineField({
      name: "instructor",
      title: "Instructor",
      type: "reference",
      to: [{ type: "instructor" }],
    }),
    defineField({
      name: "modules",
      title: "Modules",
      type: "array",
      of: [{ type: "reference", to: [{ type: "module" }] }],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: false,
    }),

    // ── On-Chain: create_course parameters ──────────────────────────────────
    defineField({
      name: "xpPerLesson",
      title: "XP Per Lesson (On-Chain)",
      type: "number",
      description:
        "Uniform XP minted by the program on every lesson completion (complete_lesson). " +
        "ALL lessons in this course award this exact amount. " +
        "The finalize_course bonus is automatically 50% of this × lessonCount.",
    }),
    defineField({
      name: "lessonCount",
      title: "Lesson Count (On-Chain)",
      type: "number",
      description:
        "Total number of lessons — must match count(modules[].lessons[]) exactly. " +
        "Used as lessonCount in create_course. " +
        "WARNING: verify this equals your linked lesson count before publishing.",
      validation: (r) => r.integer().min(1),
    }),
    defineField({
      name: "trackId",
      title: "Track ID (On-Chain)",
      type: "number",
      description: "Numeric track identifier — used as trackId in create_course.",
    }),
    defineField({
      name: "trackLevel",
      title: "Track Level (On-Chain)",
      type: "number",
      description:
        "Level within the track (1 = intro, 2 = intermediate, 3 = advanced). " +
        "Used as trackLevel in create_course.",
    }),
    defineField({
      name: "creator",
      title: "Creator Wallet (On-Chain)",
      type: "string",
      description:
        "Solana wallet address (base58) of the course creator. " +
        "Receives creatorRewardXp when minCompletionsForReward learners finish this course. " +
        "Used as creator in create_course.",
    }),
    defineField({
      name: "creatorRewardXp",
      title: "Creator Reward XP",
      type: "number",
      description:
        "Suggested XP to mint to the creator's wallet each time the completion threshold is met. " +
        "Admin may override this value during on-chain course registration (create_course).",
    }),
    defineField({
      name: "minCompletionsForReward",
      title: "Min Completions for Creator Reward",
      type: "number",
      description:
        "Suggested number of learners who must complete this course before the creator reward triggers. " +
        "Admin may override this value during on-chain course registration (create_course).",
    }),
    defineField({
      name: "prerequisiteCourseId",
      title: "Prerequisite Course ID",
      type: "string",
      description:
        "Course ID learners must complete before enrolling (e.g. intro-to-solana). " +
        "The app resolves this to a course name and link. " +
        "Note: currently only one prerequisite is supported in the on-chain program (create_course) — " +
        "this can be enhanced to accept multiple prerequisites if the program is updated in future.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "difficulty", media: "thumbnail" },
  },
});
