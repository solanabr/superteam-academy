import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pickTargets } from "./fixtures.mjs";

// The specs' view of the committed bundle the app under test was built from.
// The mock Supabase reads the same files and calls the same `pickTargets`.
const bundle = (name: string): unknown =>
  JSON.parse(
    readFileSync(
      join(__dirname, "../../src/content/generated", `${name}.json`),
      "utf8"
    )
  );

export const { ACTIVE_COURSE_SLUGS, DEACTIVATED_COURSE_SLUG, LEARN_LOOP } =
  pickTargets(bundle("courses"), bundle("lessons"));
