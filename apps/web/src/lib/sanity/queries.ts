/**
 * Re-export barrel (SP2-B Task 5). The query fns were re-implemented over the
 * committed content bundle + the Supabase on-chain deployment seam in
 * `@/lib/content/queries`; this file keeps the historic import path
 * (`@/lib/sanity/queries`) working UNCHANGED for its 33 importers. Every fn,
 * type, and `COURSES_CACHE_TAG` is re-exported verbatim — no consumer changes
 * shape. SP2-C repoints the imports and deletes this barrel.
 */
export * from "@/lib/content/queries";
