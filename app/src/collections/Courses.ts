import type { CollectionConfig } from "payload";
import { revalidatePath } from "next/cache";
import {
  parseDurationToMinutes,
  formatMinutesToDuration,
} from "@/lib/duration-utils";
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
import {
  allowPublicRead,
  isAdminOrEditor,
  isAdmin,
  adminFieldUpdate,
} from "./access";

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
    defaultColumns: ["title", "difficulty", "track", "isActive", "updatedAt"],
  },
  access: {
    read: allowPublicRead,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
    readVersions: isAdminOrEditor,
  },
  folders: true,
  versions: {
    maxPerDoc: 50,
    drafts: {
      autosave: { interval: 2000 },
    },
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data?.modules || !Array.isArray(data.modules)) return data;
        const titles = new Set<string>();
        for (const mod of data.modules) {
          const title = (mod.title as string)?.trim().toLowerCase();
          if (!title) continue;
          if (titles.has(title)) {
            throw new Error(
              `Duplicate module title "${mod.title}". Each module must have a unique title within a course.`,
            );
          }
          titles.add(title);
        }
        return data;
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (!data) return data;
        let totalXp = 0;
        let totalMinutes = 0;
        if (Array.isArray(data.modules)) {
          for (const mod of data.modules) {
            if (Array.isArray(mod.lessons)) {
              for (const lesson of mod.lessons) {
                totalXp += Number(lesson.xpReward) || 0;
                if (lesson.duration) {
                  totalMinutes += parseDurationToMinutes(
                    lesson.duration as string,
                  );
                }
              }
            }
          }
        }
        data.xpTotal = totalXp;
        if (!data.duration && totalMinutes > 0) {
          data.duration = formatMinutesToDuration(totalMinutes);
        }
        return data;
      },
      async ({ data, req }) => {
        if (!data) return data;
        if (data.track) {
          try {
            const trackDoc = await req.payload.findByID({
              collection: "tracks",
              id: String(data.track),
              depth: 0,
            });
            if (trackDoc) {
              data.trackNumId = (trackDoc as Record<string, unknown>)
                .trackId as number;
              data.trackName = (trackDoc as Record<string, unknown>)
                .name as string;
            }
          } catch {
            /* don't block save */
          }
        }
        if (data.difficulty) {
          try {
            const diffDoc = await req.payload.findByID({
              collection: "difficulties",
              id: String(data.difficulty),
              depth: 0,
            });
            if (diffDoc) {
              data.difficultyValue = (diffDoc as Record<string, unknown>)
                .value as string;
            }
          } catch {
            /* don't block save */
          }
        }
        return data;
      },
    ],
    afterChange: [
      ({ doc, req, previousDoc, operation }) => {
        // Revalidate pages
        try {
          revalidatePath("/courses", "page");
          revalidatePath(`/courses/${doc.slug}`, "page");
          revalidatePath("/", "page");
        } catch {
          // revalidatePath can throw outside of a request context (e.g. seed scripts)
        }

        // Audit log
        const actor =
          (req.user as Record<string, unknown>)?.displayName ||
          (req.user as Record<string, unknown>)?.email ||
          "system";
        req.payload.logger.info(
          `[courses] ${operation} "${doc.title}" by ${actor} (id: ${doc.id})`,
        );

        // Publish notification: draft → published
        const wasPublished =
          previousDoc?._status !== "published" && doc._status === "published";
        if (wasPublished) {
          const notifyEmail = process.env.CMS_NOTIFICATION_EMAIL;
          if (notifyEmail) {
            req.payload
              .sendEmail({
                to: notifyEmail,
                subject: `Course published: ${doc.title}`,
                text: [
                  `"${doc.title}" is now live.`,
                  `Difficulty: ${doc.difficulty || "N/A"}`,
                  `Total XP: ${doc.xpTotal ?? 0}`,
                  `Link: ${process.env.NEXT_PUBLIC_SITE_URL || ""}/courses/${doc.slug}`,
                ].join("\n"),
              })
              .catch(() => {
                // fire-and-forget — never block saves
              });
          }
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
          type: "relationship",
          relationTo: "difficulties",
          admin: { width: "50%" },
        },
        {
          name: "duration",
          type: "text",
          admin: {
            width: "50%",
            description:
              'Leave empty to auto-calculate from lesson durations. e.g. "8 hours"',
          },
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
          access: { update: adminFieldUpdate },
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "track",
          type: "relationship",
          relationTo: "tracks",
          admin: { width: "50%" },
        },
        {
          name: "trackLevel",
          type: "number",
          defaultValue: 1,
          access: { update: adminFieldUpdate },
          admin: { hidden: true },
        },
      ],
    },
    {
      name: "trackNumId",
      type: "number",
      admin: { hidden: true },
    },
    {
      name: "trackName",
      type: "text",
      admin: { hidden: true },
    },
    {
      name: "difficultyValue",
      type: "text",
      admin: { hidden: true },
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
                condition: (_, siblingData) =>
                  siblingData?.type === "challenge",
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
