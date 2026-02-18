import { createSanityClient } from "@superteam/cms";
import type { Course } from "@superteam/cms";
import { createImageUrlBuilder } from "@superteam/cms";
import { allCoursesQuery, courseBySlugQuery, allTracksQuery } from "@superteam/cms/queries";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const isSanityConfigured = Boolean(projectId);

const client = isSanityConfigured && projectId ? createSanityClient({ projectId, dataset }) : null;
const imageUrl =
	isSanityConfigured && projectId
		? createImageUrlBuilder({ projectId, dataset })
		: null;

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
	height = 675,
) {
	if (!imageUrl || !image) return null;
	return imageUrl(image).width(width).height(height).fit("crop").url();
}

export async function getCoursesCMS(): Promise<Course[]> {
	if (!client) return [];
	return client.fetch<Course[]>(allCoursesQuery);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
	if (!client) return null;
	return client.fetch<Course | null>(courseBySlugQuery, { slug });
}

export async function getCourseById(idOrSlug: string): Promise<Course | null> {
	if (!client) return null;
	const bySlug = await client.fetch<Course | null>(courseBySlugQuery, { slug: idOrSlug });
	if (bySlug) return bySlug;

	return client.fetch<Course | null>(
		`*[_type == "course" && _id == $id][0] {
			${"_id,_type,_createdAt,_updatedAt,title,slug,description,level,duration,image,published,xpReward,track,onchainStatus,arweaveTxId,coursePda,createSignature,lastSyncError"},
			"modules": *[_type == "module" && references(^._id)] | order(order asc) {
				_id,
				_type,
				title,
				slug,
				description,
				order,
				"lessonCount": count(lessons),
				"lessons": *[_type == "lesson" && references(^._id)] | order(order asc) {
					_id,
					_type,
					title,
					slug,
					content,
					order,
					xpReward,
					duration
				}
			}
		}`,
		{ id: idOrSlug },
	);
}

export async function getCourseReviews(idOrSlug: string): Promise<CourseReview[]> {
	if (!client) return [];

	const courseId = await client.fetch<string | null>(
		`coalesce(*[_type == "course" && slug.current == $id][0]._id, *[_type == "course" && _id == $id][0]._id)`,
		{ id: idOrSlug },
	);
	if (!courseId) return [];

	const reviews = await client.fetch<
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
			_id,
			rating,
			comment,
			"createdAt": coalesce(createdAt, _createdAt),
			"helpful": coalesce(helpful, helpfulCount, 0),
			"userName": coalesce(user->name, authorName, "Learner"),
			"userAvatar": user->image
		}`,
		{ courseId },
	);

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
					? resolveCourseImageUrl(review.userAvatar, 128, 128) ?? ""
					: "",
			},
		}));
}

export async function getTracks() {
	if (!client) return [];
	return client.fetch<
		Array<{
			_id: string;
			title: string;
			slug: { current: string };
			description?: string;
			courseCount: number;
		}>
	>(allTracksQuery);
}

export { isSanityConfigured };
