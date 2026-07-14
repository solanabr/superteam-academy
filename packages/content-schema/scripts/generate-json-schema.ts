import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { Course } from "../src/course";
import { Lesson } from "../src/lesson";
import { QuizBlock } from "../src/blocks/quiz";
import { Achievement } from "../src/achievement";
import { Quest } from "../src/quest";
import { LearningPath } from "../src/path";
import { SlotsLock } from "../src/slots";
import { SkillsTaxonomy } from "../src/skills";

/** One entry per file kind an author writes (or a tool generates). */
export const SCHEMA_TARGETS = {
  course: Course,
  lesson: Lesson,
  quiz: QuizBlock,
  achievement: Achievement,
  quest: Quest,
  path: LearningPath,
  slots: SlotsLock,
  skills: SkillsTaxonomy,
} as const;

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = join(here, "..", "schema");
  mkdirSync(outDir, { recursive: true });

  for (const [name, schema] of Object.entries(SCHEMA_TARGETS)) {
    // `io: "input"` so defaults show as optional — an author has not typed them yet.
    const json = z.toJSONSchema(schema, { io: "input" });
    const file = join(outDir, `${name}.schema.json`);
    writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
    console.log(`wrote ${file}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
