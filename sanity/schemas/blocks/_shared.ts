import { defineField } from "sanity";

/** Mirrors content-schema CAPABILITY_KEYS. Closed set. */
export const CAPABILITY_KEYS = ["funded-wallet", "deployed-program"] as const;

const capabilityList = CAPABILITY_KEYS.map((value) => ({
  title: value,
  value,
}));

/**
 * Shared block fields — mirror content-schema `blockBase` (produces?, consumes?).
 * Spread into each block's `fields`. Cross-block ordering (`consumes` must be
 * preceded by a `produces`) is a repo-side CI invariant (CS-1/CS-2), NOT a Sanity
 * rule: Studio is read-only, so these are informational here.
 */
export const capabilityFields = [
  defineField({
    name: "produces",
    title: "Produces capability",
    type: "string",
    options: { list: capabilityList },
  }),
  defineField({
    name: "consumes",
    title: "Consumes capabilities",
    type: "array",
    of: [{ type: "string" }],
    options: { list: capabilityList },
  }),
];
