import { defineField } from "sanity";

/**
 * Prune marker for the CS-9 repo→Sanity sync (spec §9.4). Every managed document
 * carries it; prune is `*[sync.source == "academy-courses" && sync.rev != $sha]`.
 * Field name is `sync`, NOT `_syncRev` — leading underscores are reserved for
 * Sanity system fields. Sanity-owned/read-only; the sync writes it last.
 */
export const syncField = defineField({
  name: "sync",
  title: "Sync marker",
  type: "object",
  readOnly: true,
  hidden: ({ currentUser }) =>
    !currentUser?.roles?.some((role) => role.name === "administrator"),
  description: "Managed by the content sync. Do not edit manually.",
  fields: [
    defineField({ name: "source", title: "Source", type: "string" }),
    defineField({ name: "rev", title: "Rev (git SHA)", type: "string" }),
  ],
});
