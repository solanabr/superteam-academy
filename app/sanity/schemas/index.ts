import { SchemaTypeDefinition } from "sanity";

import { track } from "./track";
import { course } from "./course";
import { lesson } from "./lesson";
import { codeChallenge } from "./codeChallenge";
import { author } from "./author";
import { achievement } from "./achievement";

/**
 * All Sanity schema types for the Superteam Academy LMS.
 *
 * Registration order determines the order shown in the Studio sidebar.
 * Reference schemas (author, codeChallenge) are listed after the types
 * that reference them so Studio can resolve them correctly.
 */
export const schemaTypes: SchemaTypeDefinition[] = [
  // Content hierarchy
  track,
  course,
  lesson,

  // Supporting types
  codeChallenge,
  author,
  achievement,
];
