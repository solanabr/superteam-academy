import { defineField, defineType } from "sanity";

const RARITY_LABELS: Record<string, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const RARITY_ORDER: Record<string, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export const achievement = defineType({
  name: "achievement",
  title: "Achievement",
  type: "document",
  fields: [
    defineField({
      name: "achievementId",
      title: "Achievement ID",
      type: "string",
      description:
        "Maps to on-chain achievement_id. Lowercase, hyphen-separated. Must be stable after mint.",
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(64)
          .regex(/^[a-z0-9-]+$/, {
            name: "achievement id format",
            invert: false,
          })
          .error(
            "Achievement ID is required and must contain only lowercase letters, numbers, and hyphens"
          ),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) =>
        rule.required().min(1).max(80).error("Name is required"),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      description: "Describes how the achievement is earned",
    }),
    defineField({
      name: "image",
      title: "Badge Image",
      type: "image",
      description: "Badge artwork displayed in the learner's profile",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "Describe the badge for screen readers",
        }),
      ],
    }),
    defineField({
      name: "rarity",
      title: "Rarity",
      type: "string",
      options: {
        list: [
          { title: "Common", value: "common" },
          { title: "Rare", value: "rare" },
          { title: "Epic", value: "epic" },
          { title: "Legendary", value: "legendary" },
        ],
        layout: "radio",
      },
      initialValue: "common",
      validation: (rule) => rule.required().error("Rarity is required"),
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward",
      type: "number",
      description: "Bonus XP granted on-chain when this achievement is earned",
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: "maxSupply",
      title: "Max Supply",
      type: "number",
      description:
        "Maximum number of times this achievement can be minted. Leave empty for unlimited.",
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Course", value: "course" },
          { title: "Community", value: "community" },
          { title: "Event", value: "event" },
          { title: "Special", value: "special" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required().error("Category is required"),
    }),
  ],
  orderings: [
    {
      title: "Rarity (Highest First)",
      name: "rarityDesc",
      by: [{ field: "rarity", direction: "desc" }],
    },
    {
      title: "Name A–Z",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
    {
      title: "XP Reward (Highest First)",
      name: "xpRewardDesc",
      by: [{ field: "xpReward", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      achievementId: "achievementId",
      rarity: "rarity",
      category: "category",
      xpReward: "xpReward",
      maxSupply: "maxSupply",
      media: "image",
    },
    prepare({
      title,
      achievementId,
      rarity,
      category,
      xpReward,
      maxSupply,
      media,
    }) {
      const rarityLabel =
        rarity !== undefined
          ? RARITY_LABELS[rarity] ?? rarity
          : undefined;
      const rarityOrder =
        rarity !== undefined ? RARITY_ORDER[rarity] ?? 0 : 0;

      // Visual rarity tier prefix for quick scanning in the studio list
      const rarityPrefix = ["★"].repeat(Math.min(rarityOrder, 4)).join("");

      const parts = [
        achievementId,
        rarityPrefix ? `${rarityPrefix} ${rarityLabel}` : undefined,
        category,
        xpReward !== undefined ? `${xpReward} XP` : undefined,
        maxSupply !== undefined ? `Supply: ${maxSupply}` : "Unlimited",
      ].filter(Boolean);

      return {
        title,
        subtitle: parts.join(" · "),
        media,
      };
    },
  },
});
