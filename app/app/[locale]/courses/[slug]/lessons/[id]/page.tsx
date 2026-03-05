/**
 * @fileoverview Main entry point for the lesson viewer page.
 * Resolves course and lesson parameters and renders the LessonViewClient.
 */

import { LessonViewClient } from "@/components/lesson/LessonViewClient";

/**
 * Main entry point for the lesson viewer page.
 */
export default async function LessonViewPage({
	params,
}: {
	params: Promise<{ slug: string; id: string }>;
}) {
	const { id, slug } = await params;

	return <LessonViewClient slug={slug} lessonId={id} />;
}
