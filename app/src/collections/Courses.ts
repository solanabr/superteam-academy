import type { CollectionConfig } from "payload";
import { revalidatePath } from "next/cache";
import {
  allowPublicRead,
  isAdminOrEditor,
  isAdmin,
  adminFieldUpdate,
} from "./access";

export const Courses: CollectionConfig = {
  slug: "courses",
  admin: {
    useAsTitle: "title",
    group: "Content",
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
    beforeChange: [
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
  ],
};
