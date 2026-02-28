import { createCourseService } from "@superteam-academy/cms";
import { cmsContext, isSanityConfigured } from "./cms-context";

const courseService = createCourseService(cmsContext);

export const {
	resolveCourseImageUrl,
	getAllCourses: getCoursesCMS,
	getAllCoursesIndex: getCoursesIndex,
	getCourseBySlug,
	getCourseById,
	getCourseReviews,
	getTracks,
} = courseService;

export { isSanityConfigured };
