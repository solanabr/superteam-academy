import { course } from "./course";
import { lesson } from "./lesson";
import { instructor } from "./instructor";
import { learningPath } from "./learningPath";
import { achievement } from "./achievement";
import { quest } from "./quest";
import { courseTag } from "./courseTag";
import { courseModule } from "./objects/courseModule";
import { testCase } from "./objects/testCase";
import { quizOption, quizQuestion } from "./blocks/quiz";
import { blockTypes } from "./blocks";

export const schemaTypes = [
  // documents
  course,
  lesson,
  instructor,
  learningPath,
  achievement,
  quest,
  courseTag,
  // shared objects
  courseModule,
  testCase,
  quizOption,
  quizQuestion,
  // block object types (registry)
  ...blockTypes,
];
