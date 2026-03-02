import type { CollectionConfig } from "payload";
import { revalidatePath } from "next/cache";
import { allowPublicRead, isAdminOrEditor, isAdmin } from "./access";

export const Modules: CollectionConfig = {
  slug: "modules",
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "course", "order", "updatedAt"],
    preview: async (doc, { req }) => {
      const courseRef = doc.course as Record<string, unknown> | string | null;
      const courseId =
        courseRef != null && typeof courseRef === "object"
          ? (courseRef as { id?: string }).id
          : courseRef;
      if (!courseId) return null;
      const course = await req.payload.findByID({
        collection: "courses",
        id: courseId,
        depth: 0,
      });
      return course?.slug ? `/courses/${course.slug}#module-${doc.id}` : null;
    },
  },
  access: {
    read: allowPublicRead,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data?.title || !data?.course) return data;

        const courseId =
          typeof data.course === "object" ? data.course.id : data.course;
        if (!courseId) return data;

        const existing = await req.payload.find({
          collection: "modules",
          where: {
            and: [
              { course: { equals: courseId } },
              { title: { equals: data.title } },
              ...(operation === "update" && data.id
                ? [{ id: { not_equals: data.id } }]
                : []),
            ],
          },
          limit: 1,
        });

        if (existing.docs.length > 0) {
          throw new Error(
            `Duplicate module title "${data.title}". Each module must have a unique title within a course.`,
          );
        }

        return data;
      },
    ],
    afterChange: [
      async ({ req, doc }) => {
        const courseId =
          doc.course != null && typeof doc.course === "object"
            ? (doc.course as Record<string, any>).id
            : doc.course;
        if (!courseId) return;
        try {
          const course = await req.payload.findByID({
            collection: "courses",
            id: courseId,
            depth: 0,
          });
          revalidatePath("/courses", "page");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((course as Record<string, any>)?.slug) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            revalidatePath(
              `/courses/${(course as Record<string, any>).slug}`,
              "page",
            );
          }
        } catch {
          /* don't block save */
        }
      },
    ],
  },
  fields: [
    {
      name: "course",
      type: "relationship",
      relationTo: "courses",
      required: true,
      admin: { description: "The course this module belongs to" },
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
      name: "order",
      type: "number",
      defaultValue: 0,
    },
  ],
};
