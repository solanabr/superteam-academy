import { localeStringType } from "./locale-string";
import { localeTextType } from "./locale-text";
import { localeMarkdownType } from "./locale-markdown";
import { testCaseType } from "./test-case";
import { exerciseType } from "./exercise";
import { challengeBlockType } from "./challenge-block";
import { lessonType } from "./lesson";
import { moduleType } from "./module";
import { courseType } from "./course";
import { challengeDocType } from "./challenge";
import { instructorType } from "./instructor";

export const schemaTypes = [
  // i18n helpers (must be registered before types that use them)
  localeStringType,
  localeTextType,
  localeMarkdownType,
  // primitives
  testCaseType,
  exerciseType,
  challengeBlockType,
  // nested objects
  lessonType,
  moduleType,
  // documents
  courseType,
  challengeDocType,
  instructorType,
];
