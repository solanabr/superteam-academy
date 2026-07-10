import { z } from "zod";
import { blockBase, relativePath } from "./base";

export const ProseBlock = z.object({
  type: z.literal("prose"),
  ...blockBase,
  src: relativePath(".md"),
});

export type ProseBlockT = z.infer<typeof ProseBlock>;
