import { fundamentalsCourses } from "./fundamentals-courses";
import { anchorCourses } from "./anchor-courses";
import { defiCourses } from "./defi-courses";
import type { Course } from "./types";

export const courses: Course[] = [
  ...fundamentalsCourses,
  ...anchorCourses,
  ...defiCourses,
];
