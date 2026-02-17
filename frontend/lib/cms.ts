import { createSanityClient } from "@superteam/cms";
import type { Course } from "@superteam/cms";
import { allCoursesQuery, courseBySlugQuery, allTracksQuery } from "@superteam/cms/queries";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const isSanityConfigured = Boolean(projectId);

const client = isSanityConfigured && projectId ? createSanityClient({ projectId, dataset }) : null;

export async function getCoursesCMS(): Promise<Course[]> {
	if (!client) return [];
	return client.fetch<Course[]>(allCoursesQuery);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
	if (!client) return null;
	return client.fetch<Course | null>(courseBySlugQuery, { slug });
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
