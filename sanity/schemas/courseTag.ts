import { defineField, defineType } from "sanity";

/**
 * Managed course-tag vocabulary. Teachers pick course tags from these values
 * (they can't type free-form tags); admins add/remove entries. Courses still
 * store tags as plain strings (`course.tags`), so this document set is the
 * allowlist rather than a set of references.
 */
export const courseTag = defineType({
  name: "courseTag",
  title: "Course Tag",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required().min(1).max(40),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 60 },
    }),
  ],
  preview: { select: { title: "name" } },
});
