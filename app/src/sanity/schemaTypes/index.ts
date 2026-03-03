import { courseType } from "./course";
import { moduleType } from "./module";
import { lessonType } from "./lesson";
import { challengeType } from "./challenge";
import { quizType } from "./quiz";

export const schema = {
  types: [courseType, moduleType, lessonType, challengeType, quizType],
};
