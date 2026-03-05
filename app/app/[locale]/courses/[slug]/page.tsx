/**
 * @fileoverview Main entry point for the course detail page.
 * Resolves dynamic parameters and renders the CourseViewClient.
 */

import { CourseViewClient } from "@/components/course-detail/CourseViewClient";

/**
 * Server Component that handles course detail routing.
 * @param params - Promise-based or static route parameters containing the slug and locale.
 */
export default async function CourseDetailPage({
	params,
}: {
	params:
		| Promise<{ slug: string; locale: string }>
		| { slug: string; locale: string };
}) {
	const resolvedParams = await params;
	const slug = resolvedParams.slug;

	return <CourseViewClient slug={slug} />;
}
