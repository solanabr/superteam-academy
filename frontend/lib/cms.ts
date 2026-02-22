import { createCourseService } from "@superteam/cms";
import type { Course } from "@superteam/cms";
import { cmsContext, isSanityConfigured } from "./cms-context";
const courseService = createCourseService(cmsContext);

export type CourseReview = {
	id: string;
	rating: number;
	comment: string;
	date: string;
	helpful: number;
	user: {
		name: string;
		avatar: string;
	};
};

export function resolveCourseImageUrl(
	image: Course["image"] | undefined,
	width = 1200,
	height = 675
) {
	return courseService.resolveCourseImageUrl(image, width, height);
}

export async function getCoursesCMS(): Promise<Course[]> {
	return courseService.getAllCourses();
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
	return courseService.getCourseBySlug(slug);
}

export async function getCourseById(idOrSlug: string): Promise<Course | null> {
	return courseService.getCourseById(idOrSlug);
}

export async function getCourseReviews(idOrSlug: string): Promise<CourseReview[]> {
	return courseService.getCourseReviews(idOrSlug);
}

export async function getTracks() {
	return courseService.getTracks();
}

export { isSanityConfigured };
