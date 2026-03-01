import { defineType, defineField } from "sanity";

export default defineType({
  name: "instructor",
  title: "Instructor",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "walletAddress", title: "Solana Wallet Address", type: "string", description: "On-chain wallet that signed/deployed this content" }),
    defineField({ name: "bio", title: "Bio", type: "text", rows: 3 }),
    defineField({ name: "avatar", title: "Avatar", type: "image", options: { hotspot: true } }),
    defineField({ name: "twitterHandle", title: "Twitter Handle", type: "string" }),
    defineField({ name: "githubHandle", title: "GitHub Handle", type: "string" }),
  ],
  preview: {
    select: { title: "name", media: "avatar" },
  },
});
