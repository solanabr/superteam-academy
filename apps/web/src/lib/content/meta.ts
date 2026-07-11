import "server-only";

import metaJson from "@/content/generated/meta.json";

/**
 * The commit SHA the committed content bundle was compiled from (SP2-B).
 *
 * Before SP2, the "last-synced" SHA lived in the Sanity `contentSync` singleton
 * and was read at request time. SP2-A moved content into a committed bundle
 * pinned to a single SHA (`apps/web/content.lock`, mirrored into
 * `src/content/generated/meta.json`), so the synced SHA is now a build-time
 * constant: the bundle *is* the synced content. The deploy (`courses/sync`) and
 * drift (`content/drift`) routes read this instead of fetching the singleton +
 * a runtime GitHub tarball.
 *
 * The ESLint `no-restricted-imports` rule bans importing the generated bundle
 * outside `src/lib/content/**`, so this thin re-export is the sanctioned way for
 * routes to reach the pinned SHA.
 */
export const SYNCED_SHA: string = metaJson.sha;
