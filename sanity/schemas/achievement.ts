import { defineField, defineType } from "sanity";

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
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category",
    },
  },
});
