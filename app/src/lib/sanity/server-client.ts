import "server-only";
import { createClient } from "@sanity/client";
import { sanityConfig } from "./config";

/**
 * Authenticated Sanity client with write access via SANITY_API_TOKEN.
 * Guarded by "server-only" — importing this file from a Client Component
 * will cause a build error, preventing token leakage to the browser.
 */
export const sanityClient = createClient({
  ...sanityConfig,
  token: process.env.SANITY_API_TOKEN,
});
