import { defineField, defineType } from "sanity";
import { syncField } from "./objects/syncField";

export const achievement = defineType({
  name: "achievement",
  title: "Achievement",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      description: "Icon identifier (e.g., emoji or icon library name)",
    }),
    defineField({
      name: "glyph",
      title: "Medal Glyph",
      type: "string",
      description:
        "Short monospace text displayed inside the octagonal medal (1-2 chars). Examples: 01, Rs, A+, \u2726",
    }),
    defineField({
      name: "solTier",
      title: "Solana Tier",
      type: "boolean",
      initialValue: false,
      description:
        "Enable the iridescent Solana-themed visual treatment for this medal.",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Progress", value: "progress" },
          { title: "Streaks", value: "streaks" },
          { title: "Skills", value: "skills" },
          { title: "Community", value: "community" },
          { title: "Special", value: "special" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward",
      type: "number",
      initialValue: 50,
      validation: (rule) => rule.required().min(1),
      description:
        "XP awarded to the student when this achievement is unlocked.",
    }),
    defineField({
      name: "maxSupply",
      title: "Max Supply",
      type: "number",
      initialValue: 0,
      description:
        "Maximum number of times this achievement can be awarded. 0 = unlimited.",
    }),
    defineField({
      name: "metadataUri",
      title: "Metadata URI",
      type: "url",
      description:
        "URI for the NFT metadata JSON. Leave blank to use the platform default endpoint.",
    }),
    defineField({
      name: "award",
      title: "Unlock Award",
      type: "object",
      description:
        "Declarative unlock rule (spec §4.10, D9). Mirrors content-schema Award; CS-9 sync writes the resolved discriminated union. The app evaluates PREDICATES[award.kind] — unlock logic is content, not TypeScript.",
      fields: [
        defineField({
          name: "kind",
          title: "Kind",
          type: "string",
          options: {
            list: [
              "lessons-completed",
              "lessons-completed-in-course",
              "course-completed",
              "path-completed",
              "streak",
              "user-number",
              "community-stat",
              "manual",
            ],
          },
        }),
        defineField({
          name: "gte",
          title: "Threshold (gte)",
          type: "number",
          description:
            "lessons-completed / lessons-completed-in-course / community-stat.",
        }),
        defineField({
          name: "lte",
          title: "Threshold (lte)",
          type: "number",
          description: "user-number.",
        }),
        defineField({
          name: "days",
          title: "Days",
          type: "number",
          description: "streak.",
        }),
        defineField({
          name: "course",
          title: "Course id",
          type: "string",
          description: "course-completed / lessons-completed-in-course.",
        }),
        defineField({
          name: "path",
          title: "Path id",
          type: "string",
          description: "path-completed.",
        }),
        defineField({
          name: "stat",
          title: "Community stat",
          type: "string",
          description: "community-stat.",
          options: {
            list: [
              "totalThreads",
              "totalAnswers",
              "acceptedAnswers",
              "totalCommunityXp",
            ],
          },
        }),
      ],
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
        defineField({
          name: "status",
          title: "Status",
          type: "string",
          options: { list: ["synced"] },
        }),
        defineField({
          name: "achievementPda",
          title: "Achievement PDA",
          type: "string",
        }),
        defineField({
          name: "collectionAddress",
          title: "Collection Address",
          type: "string",
        }),
        defineField({
          name: "lastSynced",
          title: "Last Synced",
          type: "datetime",
        }),
      ],
    }),
    syncField,
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category",
    },
  },
});
