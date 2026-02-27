import type { Metadata } from "next";
import { buildLessonMetadata, LessonPageContent } from "@/app/[locale]/courses/[id]/learn/page";

interface CanonicalLessonPageProps {
	params: Promise<{
		id: string;
		lessonId: string;
	}>;
}

export async function generateMetadata({ params }: CanonicalLessonPageProps): Promise<Metadata> {
	const { id, lessonId } = await params;
	return buildLessonMetadata(id, lessonId);
}

export default async function CanonicalLessonPage({ params }: CanonicalLessonPageProps) {
	const { id, lessonId } = await params;
	return (
		<div className="min-h-screen bg-background">
			<LessonPageContent courseId={id} lessonId={lessonId} />
		</div>
	);
}
