import type { Metadata } from "next";
import { getCourseBySlug } from "@/lib/content/queries";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await getCourseBySlug(params.slug);

  // Course not found / not yet public — fall back to a slug-derived title.
  if (!course) {
    const fallback = params.slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return {
      title: fallback,
      description: `Learn ${fallback} on Superteam Academy — the Solana developer education platform.`,
    };
  }

  const description =
    course.description ??
    `Learn ${course.title} on Superteam Academy — the Solana developer education platform.`;
  const images = course.thumbnail ? [{ url: course.thumbnail }] : undefined;

  return {
    title: course.title,
    description,
    openGraph: {
      title: course.title,
      description,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description,
      images: course.thumbnail ? [course.thumbnail] : undefined,
    },
  };
}

export default function CourseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
