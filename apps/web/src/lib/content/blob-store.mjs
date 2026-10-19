/**
 * Public base URL of the `academy-content-assets` Vercel Blob store
 * (`store_UWblYDRlnYgsClIZ`, iad1), where every course image lives under a
 * content-addressed `content/<sha256>.<ext>` key.
 *
 * Vercel serves a public store at `https://<store id without "store_",
 * lowercased>.public.blob.vercel-storage.com` (`constructBlobUrl` in
 * `@vercel/blob`). Plain `.mjs` so `next.config.mjs` reads the same value as
 * the compiler, the CSP builder and the build-time sync. A wrong value fails
 * the Vercel build: the sync asserts every `put()` URL equals the URL the
 * compiler wrote.
 */
export const CONTENT_BLOB_BASE_URL =
  "https://uwblydrlnygscliz.public.blob.vercel-storage.com";
