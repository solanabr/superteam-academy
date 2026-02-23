import { createClient, type SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = "2024-01-01";

export function isSanityConfigured(): boolean {
  return Boolean(projectId && projectId !== "your_sanity_project_id");
}

// Lazy-initialised client — only created when Sanity is actually configured,
// avoiding the "Configuration must contain projectId" error during builds
// where the env var is not set.
let _client: SanityClient | null = null;

export const sanityClient: SanityClient = new Proxy({} as SanityClient, {
  get(_target, prop) {
    if (!_client) {
      if (!isSanityConfigured()) {
        throw new Error(
          "Sanity client accessed without a configured project ID. " +
            "Check isSanityConfigured() before calling sanityClient.",
        );
      }
      _client = createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: process.env.NODE_ENV === "production",
      });
    }
    const value = (_client as any)[prop];
    if (typeof value === "function") {
      return value.bind(_client);
    }
    return value;
  },
});

export function urlFor(source: SanityImageSource) {
  const builder = imageUrlBuilder(sanityClient);
  return builder.image(source);
}
