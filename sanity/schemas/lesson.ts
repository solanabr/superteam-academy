import { defineField, defineType } from "sanity";
import { BLOCK_MEMBERS } from "./blocks";
import { syncField } from "./objects/syncField";

/**
 * A lesson is the atomic completable unit (one bit of the on-chain bitmap). Its
 * content is an ordered `blocks[]` page-builder array (spec §4.4, §10). The
 * lesson `_id` IS the lesson id (`lesson-accounts`) — no separate `id` field.
 * `block.key` is the array item `_key`. There is no lesson-level `type`,
 * `language`, `content`, `code`, `tests`, `solution`, `widgets` or `order`; each
 * moved into a block. `sync` is the CS-9 prune marker.
 */
export const lesson = defineType({
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "blocks",
      title: "Blocks",
      type: "array",
      of: BLOCK_MEMBERS,
      validation: (r) => r.required().min(1),
    }),
    syncField,
  ],
  preview: {
    select: { title: "title", blocks: "blocks" },
    prepare: ({ title, blocks }) => ({
      title,
      subtitle: `${(blocks as unknown[] | undefined)?.length ?? 0} blocks`,
    }),
  },
});
