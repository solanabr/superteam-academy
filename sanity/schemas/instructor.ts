import { defineField, defineType } from "sanity";
import { syncField } from "./objects/syncField";

export const instructor = defineType({
  name: "instructor",
  title: "Instructor",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "wallet",
      title: "Wallet",
      type: "string",
      description:
        "On-curve Solana address. Resolved at sync to Course.creator (creator XP recipient) for every course this instructor teaches, and the platform-identity key (profiles.wallet_address).",
      validation: (rule) =>
        rule
          .required()
          .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, { name: "base58 address" }),
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "object",
      fields: [
        defineField({
          name: "twitter",
          title: "Twitter",
          type: "string",
        }),
        defineField({
          name: "github",
          title: "GitHub",
          type: "string",
        }),
      ],
    }),
    syncField,
  ],
  preview: {
    select: {
      title: "name",
      media: "avatar",
    },
  },
});
