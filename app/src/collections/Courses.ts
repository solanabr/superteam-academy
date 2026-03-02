import type { CollectionConfig } from "payload";
import { revalidatePath } from "next/cache";
import {
  lexicalEditor,
  FixedToolbarFeature,
  InlineToolbarFeature,
  HeadingFeature,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  InlineCodeFeature,
  AlignFeature,
  IndentFeature,
  OrderedListFeature,
  UnorderedListFeature,
  ChecklistFeature,
  BlockquoteFeature,
  LinkFeature,
  HorizontalRuleFeature,
  BlocksFeature,
  CodeBlock,
} from "@payloadcms/richtext-lexical";

const richTextFeatures = [
  FixedToolbarFeature(),
  InlineToolbarFeature(),
  HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3"] }),
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  StrikethroughFeature(),
  SubscriptFeature(),
  SuperscriptFeature(),
  InlineCodeFeature(),
  AlignFeature(),
  IndentFeature(),
  OrderedListFeature(),
  UnorderedListFeature(),
  ChecklistFeature(),
  BlockquoteFeature(),
  LinkFeature(),
  HorizontalRuleFeature(),
  BlocksFeature({ blocks: [CodeBlock()] }),
];

const promptFeatures = [
  FixedToolbarFeature(),
  InlineToolbarFeature(),
  HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
  BoldFeature(),
  ItalicFeature(),
  InlineCodeFeature(),
  OrderedListFeature(),
  UnorderedListFeature(),
  BlocksFeature({ blocks: [CodeBlock()] }),
];

export const Courses: CollectionConfig = {
  slug: "courses",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "difficulty", "trackName", "isActive", "updatedAt"],
  },
  versions: {
    maxPerDoc: 50,
    drafts: {
      autosave: { interval: 2000 },
    },
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data;
        let total = 0;
        if (Array.isArray(data.modules)) {
          for (const mod of data.modules) {
            if (Array.isArray(mod.lessons)) {
              for (const lesson of mod.lessons) {
                total += Number(lesson.xpReward) || 0;
              }
            }
          }
        }
        data.xpTotal = total;
        return data;
      },
    ],
    afterChange: [
      ({ doc }) => {
        try {
          revalidatePath("/courses", "page");
          revalidatePath(`/courses/${doc.slug}`, "page");
          revalidatePath("/", "page");
        } catch {
          // revalidatePath can throw outside of a request context (e.g. seed scripts)
        }
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      unique: true,
      admin: {
        readOnly: true,
        description: "Auto-generated from title",
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return (data.title as string)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            }
            return value;
          },
        ],
      },
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "thumbnail",
      type: "upload",
      relationTo: "media",
    },
    {
      type: "row",
      fields: [
        {
          name: "difficulty",
          type: "select",
          options: [
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Advanced", value: "advanced" },
          ],
          defaultValue: "beginner",
          admin: { width: "50%" },
        },
        {
          name: "duration",
          type: "text",
          admin: { width: "50%", description: 'e.g. "8 hours"' },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "xpTotal",
          type: "number",
          defaultValue: 0,
          admin: {
            width: "50%",
            readOnly: true,
            description: "Auto-computed from lesson XP rewards",
          },
        },
        {
          name: "isActive",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "trackId",
          type: "number",
          defaultValue: 1,
          admin: { width: "25%" },
        },
        {
          name: "trackLevel",
          type: "number",
          defaultValue: 1,
          admin: { width: "25%" },
        },
        {
          name: "trackName",
          type: "text",
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "creator",
          type: "text",
          admin: { width: "50%" },
        },
        {
          name: "creatorAvatar",
          type: "text",
          admin: { width: "50%", description: "URL to creator avatar image" },
        },
      ],
    },
    {
      name: "tags",
      type: "array",
      fields: [{ name: "tag", type: "text" }],
    },
    {
      name: "prerequisites",
      type: "array",
      fields: [{ name: "slug", type: "text" }],
    },
    {
      name: "modules",
      type: "array",
      minRows: 1,
      admin: { description: "Course modules, each containing lessons" },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "textarea",
        },
        {
          name: "order",
          type: "number",
          defaultValue: 0,
        },
        {
          name: "lessons",
          type: "array",
          minRows: 1,
          admin: {
            description:
              "Set type to Content for reading material or Challenge for coding exercises.",
          },
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
            },
            {
              name: "description",
              type: "textarea",
            },
            {
              name: "type",
              type: "select",
              options: [
                { label: "Content", value: "content" },
                { label: "Challenge", value: "challenge" },
              ],
              defaultValue: "content",
              admin: {
                description:
                  "Content = reading/video lesson. Challenge = interactive coding exercise.",
              },
            },
            {
              name: "order",
              type: "number",
              defaultValue: 0,
            },
            {
              name: "xpReward",
              type: "number",
              defaultValue: 0,
            },
            {
              name: "duration",
              type: "text",
            },
            {
              name: "videoUrl",
              type: "text",
              admin: {
                description: "YouTube/Vimeo embed URL for video lessons",
                condition: (_, siblingData) => siblingData?.type === "content",
              },
            },
            {
              name: "content",
              type: "richText",
              editor: lexicalEditor({ features: richTextFeatures }),
              admin: {
                description:
                  "Lesson body — rich text with headings, lists, code blocks, etc.",
                condition: (_, siblingData) => siblingData?.type === "content",
              },
            },
            {
              name: "challenge",
              type: "group",
              admin: {
                condition: (_, siblingData) => siblingData?.type === "challenge",
              },
              fields: [
                {
                  name: "prompt",
                  type: "richText",
                  editor: lexicalEditor({ features: promptFeatures }),
                },
                {
                  name: "starterCode",
                  type: "code",
                  required: true,
                  admin: { language: "typescript" },
                },
                {
                  name: "language",
                  type: "select",
                  options: [
                    { label: "Rust", value: "rust" },
                    { label: "TypeScript", value: "typescript" },
                    { label: "JSON", value: "json" },
                  ],
                  defaultValue: "typescript",
                },
                {
                  name: "hints",
                  type: "array",
                  fields: [{ name: "hint", type: "text" }],
                },
                {
                  name: "solution",
                  type: "code",
                  admin: { language: "typescript" },
                },
                {
                  name: "testCases",
                  type: "array",
                  minRows: 1,
                  fields: [
                    { name: "name", type: "text", required: true },
                    { name: "input", type: "text" },
                    { name: "expectedOutput", type: "text", required: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
