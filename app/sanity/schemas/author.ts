import { defineField, defineType } from "sanity";

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) =>
        rule.required().min(1).max(80).error("Name is required"),
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "Describe the image for screen readers",
        }),
      ],
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "twitter",
      title: "Twitter / X Handle",
      type: "string",
      description: "Without the @ symbol (e.g. 'solana')",
      validation: (rule) =>
        rule
          .regex(/^[A-Za-z0-9_]{1,15}$/, {
            name: "twitter handle",
            invert: false,
          })
          .warning("Must be a valid Twitter handle (1–15 alphanumeric chars or underscores, no @)"),
    }),
    defineField({
      name: "github",
      title: "GitHub Username",
      type: "string",
      description: "Without the @ symbol (e.g. 'solana-labs')",
      validation: (rule) =>
        rule
          .regex(/^[A-Za-z0-9-]{1,39}$/, {
            name: "github username",
            invert: false,
          })
          .warning("Must be a valid GitHub username"),
    }),
    defineField({
      name: "wallet",
      title: "Solana Wallet Address",
      type: "string",
      description: "Base58-encoded Solana public key",
      validation: (rule) =>
        rule
          .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, {
            name: "solana address",
            invert: false,
          })
          .warning("Must be a valid base58 Solana public key"),
    }),
  ],
  preview: {
    select: {
      title: "name",
      twitter: "twitter",
      github: "github",
      media: "avatar",
    },
    prepare({ title, twitter, github, media }) {
      const handles = [
        twitter ? `@${twitter}` : undefined,
        github ? `github/${github}` : undefined,
      ]
        .filter(Boolean)
        .join("  ·  ");

      return {
        title,
        subtitle: handles || undefined,
        media,
      };
    },
  },
});
