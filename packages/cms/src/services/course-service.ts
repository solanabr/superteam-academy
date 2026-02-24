import type { Course } from "../schemas";
import type { CMSContext } from "./cms-service";
import {
	allCoursesQuery,
	courseBySlugQuery,
	coursesByTrackQuery,
	allTracksQuery,
} from "../queries";

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

export function createCourseService(context: CMSContext) {
	const { fetch, resolveImageUrl, readClient } = context;

	const getAllCourses = async (): Promise<Course[]> => {
		if (!readClient) return [];
		return (await fetch<Course[]>(allCoursesQuery)) || [];
	};

	const getCourseBySlug = async (slug: string): Promise<Course | null> => {
		if (!readClient) return null;
		return fetch<Course | null>(courseBySlugQuery, { slug });
	};

	const getCourseById = async (idOrSlug: string): Promise<Course | null> => {
		if (!readClient) return null;

		const bySlug = await fetch<Course | null>(courseBySlugQuery, { slug: idOrSlug });
		if (bySlug) return bySlug;

		return fetch<Course | null>(
			`*[_type == "course" && _id == $id][0] {
				_id,_type,_createdAt,_updatedAt,title,slug,description,level,duration,image,published,xpReward,track,onchainStatus,arweaveTxId,coursePda,createSignature,lastSyncError,
				"author": author->{_id,name,slug,image,bio,walletAddress},
				"modules": *[_type == "module" && references(^._id)] | order(order asc) {
					_id,_type,title,slug,description,order,"lessonCount": count(lessons),
					"lessons": *[_type == "lesson" && references(^._id)] | order(order asc) {
						_id,_type,title,slug,content,order,xpReward,duration
					}
				}
			}`,
			{ id: idOrSlug }
		);
	};

	const getCoursesByTrack = async (track: string): Promise<Course[]> => {
		if (!readClient) return [];
		return (await fetch<Course[]>(coursesByTrackQuery, { track })) || [];
	};

	const getTracks = async (): Promise<
		Array<{
			_id: string;
			title: string;
			slug: { current: string };
			description?: string;
			courseCount: number;
		}>
	> => {
		if (!readClient) return [];
		return (
			(await fetch<
				Array<{
					_id: string;
					title: string;
					slug: { current: string };
					description?: string;
					courseCount: number;
				}>
			>(allTracksQuery)) || []
		);
	};

	const getCourseReviews = async (idOrSlug: string): Promise<CourseReview[]> => {
		if (!readClient) return [];

		const courseId = await fetch<string | null>(
			`coalesce(*[_type == "course" && slug.current == $id][0]._id, *[_type == "course" && _id == $id][0]._id)`,
			{ id: idOrSlug }
		);

		if (!courseId) return [];

		const reviews = await fetch<
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
						? (resolveImageUrl(review.userAvatar, 128, 128) ?? "")
						: "",
				},
			}));
	};

	const resolveCourseImageUrl = (
		image: Course["image"] | undefined,
		width = 1200,
		height = 675
	): string | null => resolveImageUrl(image, width, height);

	return {
		getAllCourses,
		getCourseBySlug,
		getCourseById,
		getCoursesByTrack,
		getTracks,
		getCourseReviews,
		resolveCourseImageUrl,
	};
}
