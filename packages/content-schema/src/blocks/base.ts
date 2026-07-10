import { z } from "zod";
import { BlockKey } from "../ids";
import { CapabilityKey } from "../capabilities";

/**
 * Fields shared by every block. Spread into each block's `z.object({...})` —
 * not a base schema to extend, because `discriminatedUnion` requires plain
 * object members.
 */
export const blockBase = {
  key: BlockKey,
  produces: CapabilityKey.optional(),
  consumes: z.array(CapabilityKey).nonempty().optional(),
};

/** A path relative to the lesson directory. No escaping, no absolutes. */
export function relativePath(extension: `.${string}`) {
  return z
    .string()
    .refine((p) => !p.startsWith("/"), {
      message: "must be relative to the lesson directory",
    })
    .refine((p) => !p.split("/").includes(".."), {
      message: "must not escape the lesson directory",
    })
    .refine((p) => p.endsWith(extension), {
      message: `must end with ${extension}`,
    });
}
