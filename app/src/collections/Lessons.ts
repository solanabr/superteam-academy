import type { CollectionConfig } from "payload";
import { revalidatePath } from "next/cache";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import {
  parseDurationToMinutes,
  formatMinutesToDuration,
} from "@/lib/duration-utils";
import { richTextFeatures, promptFeatures } from "./shared/richtext-features";
import { allowPublicRead, isAdminOrEditor, isAdmin } from "./access";

export const Lessons: CollectionConfig = {
  slug: "lessons",
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "module", "type", "xpReward", "order"],
    preview: async (doc, { req }) => {
      const moduleRef = doc.module as Record<string, unknown> | string | null;
      const moduleId =
        moduleRef != null && typeof moduleRef === "object"
          ? (moduleRef as { id?: string }).id
          : moduleRef;
      if (!moduleId) return null;
      const mod = await req.payload.findByID({
        collection: "modules",
        id: moduleId,
        depth: 0,
      });
      const courseId =
        typeof mod?.course === "object" ? mod.course.id : mod?.course;
      if (!courseId) return null;
      const course = await req.payload.findByID({
        collection: "courses",
        id: courseId,
        depth: 0,
      });
      return course?.slug ? `/courses/${course.slug}/lessons/${doc.id}` : null;
    },
  },
  access: {
    read: allowPublicRead,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (!data?.module) return data;
        const moduleId =
          typeof data.module === "object" ? data.module.id : data.module;
        if (!moduleId) return data;
        try {
          const mod = await req.payload.findByID({
            collection: "modules",
            id: moduleId,
            depth: 0,
          });
          if (mod?.course) {
            data.course =
              typeof mod.course === "object" ? mod.course.id : mod.course;
          }
        } catch {
          /* don't block save */
        }
        return data;
      },
    ],
    afterChange: [
      ({ req, doc }) => {
        // Non-async: Payload won't await this, so the transaction commits immediately.
        // Heavy work runs in a detached promise after the transaction settles.
        const { payload } = req;
        const moduleRef = doc.module;

        void (async () => {
          try {
            const moduleId =
              moduleRef != null && typeof moduleRef === "object"
                ? (moduleRef as Record<string, any>).id
                : moduleRef;
            if (!moduleId) return;

            const mod = await payload.findByID({
              collection: "modules",
              id: moduleId,
              depth: 0,
            });
            const raw = mod as Record<string, any>;
            const courseId =
              raw.course != null && typeof raw.course === "object"
                ? raw.course.id
                : raw.course;
            if (!courseId) return;

            const allModules = await payload.find({
              collection: "modules",
              where: { course: { equals: courseId } },
              limit: 1000,
            });
            const moduleIds = allModules.docs.map((m) => m.id);
            if (moduleIds.length === 0) return;

            const allLessons = await payload.find({
              collection: "lessons",
              where: { module: { in: moduleIds } },
              limit: 10000,
            });

            let totalXp = 0;
            let totalMinutes = 0;
            for (const lesson of allLessons.docs) {
              const l = lesson as Record<string, any>;
              totalXp += Number(l.xpReward) || 0;
              if (l.duration) {
                totalMinutes += parseDurationToMinutes(l.duration as string);
              }
            }

            const updateData: Record<string, any> = { xpTotal: totalXp };

            const course = await payload.findByID({
              collection: "courses",
              id: courseId,
              depth: 0,
            });
            if (!(course as Record<string, any>).duration && totalMinutes > 0) {
              updateData.duration = formatMinutesToDuration(totalMinutes);
            }

            await payload.update({
              collection: "courses",
              id: courseId,
              data: updateData,
            });

            try {
              revalidatePath("/courses", "page");
              if ((course as Record<string, any>).slug) {
                revalidatePath(
                  `/courses/${(course as Record<string, any>).slug}`,
                  "page",
                );
              }
            } catch {
              /* revalidatePath can throw outside request context */
            }
          } catch {
            /* fire-and-forget — never block */
          }
        })();
      },
    ],
  },
  fields: [
    {
      name: "course",
      type: "relationship",
      relationTo: "courses",
      admin: {
        description: "Select a course to filter the module dropdown below",
      },
    },
    {
      name: "module",
      type: "relationship",
      relationTo: "modules",
      required: true,
      filterOptions: ({ siblingData }) => {
        const sd = siblingData as Record<string, unknown> | undefined;
        if (sd?.course) {
          return { course: { equals: sd.course } };
        }
        return true;
      },
      admin: { description: "The module this lesson belongs to" },
    },
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
          fields: [
            { name: "name", type: "text", required: true },
            { name: "input", type: "text" },
            { name: "expectedOutput", type: "text", required: true },
          ],
        },
      ],
    },
  ],
};
