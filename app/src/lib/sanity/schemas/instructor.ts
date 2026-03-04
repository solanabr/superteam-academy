import type { Rule } from "sanity";

export const instructorSchema = {
  name: "instructor",
  title: "Instructor",
  type: "document",
  fields: [
    { name: "name", title: "Name", type: "string", validation: (Rule: Rule) => Rule.required() },
    { name: "avatar", title: "Avatar", type: "image" },
    { name: "bio", title: "Bio", type: "text" },
    { name: "socialLinks", title: "Social Links", type: "array", of: [{ type: "object", fields: [
      { name: "platform", title: "Platform", type: "string" },
      { name: "url", title: "URL", type: "url" },
    ] }] },
    { name: "walletAddress", title: "Wallet Address", type: "string" },
  ],
};
