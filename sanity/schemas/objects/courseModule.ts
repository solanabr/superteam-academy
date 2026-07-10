import { defineField, defineType } from "sanity";

/**
 * Inline module object on the course (spec §10.1) — replaces the standalone
 * `module` document. Mirrors content-schema CourseModule (`key`, `title`,
 * `description?`, `lessons[]`). Display order is the array position, so there is
 * no `order` field. Lesson refs are WEAK (spec §9.5): a rebuildable projection
 * cannot delete a lesson with an incoming strong ref, and a dangling `->`
 * dereferences to null, which the projection already tolerates.
 */
export const courseModule = defineType({
  name: "courseModule",
  title: "Module",
  type: "object",
  fields: [
    defineField({
      name: "key",
      title: "Module key",
      type: "string",
      description:
        "Stable, unique within the course. Mirrors CourseModule.key.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "lessons",
      title: "Lessons",
      type: "array",
      of: [{ type: "reference", to: [{ type: "lesson" }], weak: true }],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { title: "title", lessons: "lessons" },
    prepare: ({ title, lessons }) => ({
      title,
      subtitle: `${(lessons as unknown[] | undefined)?.length ?? 0} lessons`,
    }),
  },
});
