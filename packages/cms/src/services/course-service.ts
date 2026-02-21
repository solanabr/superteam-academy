import type { Course } from "../schemas";
import { CMSService } from "./cms-service";
import {
	allCoursesQuery,
	courseBySlugQuery,
	coursesByTrackQuery,
	allTracksQuery,
} from "../queries";

export class CourseService extends CMSService {
	async getAllCourses(): Promise<Course[]> {
		if (!this.client) return [];
		return (await this.fetch<Course[]>(allCoursesQuery)) || [];
	}

	async getCourseBySlug(slug: string): Promise<Course | null> {
		if (!this.client) return null;
		return this.fetch<Course | null>(courseBySlugQuery, { slug });
	}

	async getCourseById(idOrSlug: string): Promise<Course | null> {
		if (!this.client) return null;

		const bySlug = await this.fetch<Course | null>(courseBySlugQuery, { slug: idOrSlug });
		if (bySlug) return bySlug;

		return this.fetch<Course | null>(
			`*[_type == "course" && _id == $id][0] {
				_id,_type,_createdAt,_updatedAt,title,slug,description,level,duration,image,published,xpReward,track,onchainStatus,arweaveTxId,coursePda,createSignature,lastSyncError,
				"modules": *[_type == "module" && references(^._id)] | order(order asc) {
					_id,_type,title,slug,description,order,"lessonCount": count(lessons),
					"lessons": *[_type == "lesson" && references(^._id)] | order(order asc) {
						_id,_type,title,slug,content,order,xpReward,duration
					}
				}
			}`,
			{ id: idOrSlug }
		);
	}

	async getCoursesByTrack(track: string): Promise<Course[]> {
		if (!this.client) return [];
		return (await this.fetch<Course[]>(coursesByTrackQuery, { track })) || [];
	}

	async getTracks() {
		if (!this.client) return [];
		return (
			(await this.fetch<
				Array<{
					_id: string;
					title: string;
					slug: { current: string };
					description?: string;
					courseCount: number;
				}>
			>(allTracksQuery)) || []
		);
	}

	async getCourseReviews(idOrSlug: string) {
		if (!this.client) return [];

		const courseId = await this.fetch<string | null>(
			`coalesce(*[_type == "course" && slug.current == $id][0]._id, *[_type == "course" && _id == $id][0]._id)`,
			{ id: idOrSlug }
		);

		if (!courseId) return [];

		const reviews = await this.fetch<
			Array<{
				_id: string;
				rating?: number;
				comment?: string;
				createdAt?: string;
				helpful?: number;
				userName?: string;
				userAvatar?: { _type: "image"; asset: { _ref: string; _type: "reference" } };
			}>
		>(
			`*[_type == "courseReview" && references($courseId)] | order(_createdAt desc) {
				_id,rating,comment,
				"createdAt": coalesce(createdAt, _createdAt),
				"helpful": coalesce(helpful, helpfulCount, 0),
				"userName": coalesce(user->name, authorName, "Learner"),
				"userAvatar": user->image
			}`,
			{ courseId }
		);

		if (!reviews) return [];

		return reviews
			.filter((review) => typeof review.rating === "number" && Boolean(review.comment))
			.map((review) => ({
				id: review._id,
				rating: Math.max(1, Math.min(5, Math.round(review.rating ?? 0))),
				comment: review.comment ?? "",
				date: review.createdAt ?? new Date().toISOString(),
				helpful: review.helpful ?? 0,
				user: {
					name: review.userName ?? "Learner",
					avatar: review.userAvatar
						? (this.resolveImageUrl(review.userAvatar, 128, 128) ?? "")
						: "",
				},
			}));
	}

	resolveCourseImageUrl(image: Course["image"] | undefined, width = 1200, height = 675) {
		return this.resolveImageUrl(image, width, height);
	}
}
