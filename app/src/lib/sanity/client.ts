import { createClient } from "@sanity/client";
import { sanityConfig } from "./config";

export const publicClient = createClient({
  ...sanityConfig,
});
