import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface LessonPageProps {
	params: Promise<{
		locale: string;
		id: string;
	}>;
	searchParams?: Promise<{
		lesson?: string;
	}>;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "seo.dynamic.lesson" });
	return { title: t("title", { lesson: "", course: "" }) };
}

export default async function LearnRedirectPage({ params, searchParams }: LessonPageProps) {
	const { id } = await params;
	const resolvedSearchParams = await searchParams;
	const lessonId = resolvedSearchParams?.lesson || "1-1";
	redirect(`/courses/${id}/lessons/${lessonId}`);
}
