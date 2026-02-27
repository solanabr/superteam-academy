import type { Metadata } from "next";
import {
	buildLessonMetadata,
	LegacyLessonPageRenderer,
} from "@/app/[locale]/courses/[id]/learn/page";

interface CanonicalLessonPageProps {
	params: Promise<{
		slug: string;
		id: string;
	}>;
}

export async function generateMetadata({ params }: CanonicalLessonPageProps): Promise<Metadata> {
	const { slug, id } = await params;
	return buildLessonMetadata(slug, id);
}

export default async function CanonicalLessonPage({ params }: CanonicalLessonPageProps) {
	const { slug, id } = await params;
	return <LegacyLessonPageRenderer courseId={slug} lessonId={id} />;
}
