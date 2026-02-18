import { courseType } from "./course";
import { moduleType } from "./module";
import { lessonType } from "./lesson";
import { challengeType } from "./challenge";

export const schema = {
  types: [courseType, moduleType, lessonType, challengeType],
};
