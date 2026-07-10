import { z } from "zod";
import { blockBase } from "./base";

export const VideoBlock = z.object({
  type: z.literal("video"),
  ...blockBase,
  /** YouTube or Vimeo. `lesson-client.tsx` resolves the embed via getEmbedUrl. */
  url: z
    .url()
    .refine((u) => u.startsWith("https://"), { message: "must be https" }),
});

export type VideoBlockT = z.infer<typeof VideoBlock>;
