import { defineField, defineType } from "sanity";

export const course = defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: {
        list: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Advanced", value: "advanced" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "duration",
      title: "Duration (hours)",
      type: "number",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "instructor",
      title: "Instructor",
      type: "reference",
      to: [{ type: "instructor" }],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward",
      type: "number",
      validation: (rule) => rule.required().min(0),
      initialValue: 500,
    }),
    defineField({
      name: "modules",
      title: "Modules",
      type: "array",
      of: [{ type: "reference", to: [{ type: "module" }] }],
    }),
    defineField({
      name: "xpPerLesson",
      title: "XP per Lesson",
      type: "number",
      initialValue: 10,
      validation: (rule) => rule.required().min(1).max(100),
    }),
    defineField({
      name: "trackId",
      title: "Track ID",
      type: "number",
      initialValue: 0,
      description: "Numeric learning track identifier (0 = default track).",
    }),
    defineField({
      name: "trackLevel",
      title: "Track Level",
      type: "number",
      initialValue: 0,
      description: "Position within the track (0 = first).",
    }),
    defineField({
      name: "prerequisiteCourse",
      title: "Prerequisite Course",
      type: "reference",
      to: [{ type: "course" }],
      description: "Students must complete this course before enrolling.",
    }),
    defineField({
      name: "creatorRewardXp",
      title: "Creator Reward XP",
      type: "number",
      initialValue: 0,
      description:
        "XP awarded to the course creator once min completions threshold is reached.",
    }),
    defineField({
      name: "minCompletionsForReward",
      title: "Min Completions for Creator Reward",
      type: "number",
      initialValue: 0,
      description:
        "Number of student completions required before creator reward is paid. 0 = never.",
    }),
    defineField({
      name: "author",
      title: "Author (Teacher User ID)",
      type: "string",
      readOnly: true,
      hidden: ({ currentUser }) =>
        !currentUser?.roles?.some((r) => r.name === "administrator"),
      description:
        "Supabase user id of the owning teacher. Managed by the app; do not edit manually.",
    }),
    defineField({
      name: "authoringStatus",
      title: "Authoring Status",
      type: "string",
      initialValue: "draft",
      hidden: ({ currentUser }) =>
        !currentUser?.roles?.some((r) => r.name === "administrator"),
      description:
        "Authoring workflow state. New courses start as draft; an admin approves before it goes public.",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Pending Review", value: "pending_review" },
          { title: "Approved", value: "approved" },
        ],
      },
    }),
    defineField({
      name: "reviewFeedback",
      title: "Review Feedback",
      type: "text",
      rows: 3,
      readOnly: true,
      hidden: ({ currentUser }) =>
        !currentUser?.roles?.some((r) => r.name === "administrator"),
      description:
        "Admin feedback shown to the teacher when a course is rejected.",
    }),
    defineField({
      name: "onChainStatus",
      title: "On-Chain Status",
      type: "object",
      readOnly: true,
      hidden: ({ currentUser }) =>
        !currentUser?.roles?.some((r) => r.name === "administrator"),
      description: "Managed by the admin dashboard. Do not edit manually.",
      fields: [
        defineField({ name: "status", title: "Status", type: "string" }),
        defineField({
          name: "isActive",
          title: "Active",
          type: "boolean",
          description:
            "Mirrors the on-chain is_active flag. Set false on deactivate to hide the course from the public catalog. Legacy courses without this field are treated as active.",
        }),
        defineField({ name: "coursePda", title: "Course PDA", type: "string" }),
        defineField({
          name: "trackCollectionAddress",
          title: "Track Collection Address",
          type: "string",
          description:
            "Metaplex Core collection pubkey for this course's credential NFTs.",
        }),
        defineField({
          name: "lastSynced",
          title: "Last Synced",
          type: "datetime",
        }),
        defineField({
          name: "txSignature",
          title: "Tx Signature",
          type: "string",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "difficulty",
      media: "thumbnail",
    },
  },
});
