import type { Metadata } from "next";

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const title = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title,
    description: `Learn ${title} on Superteam LMS — the Solana developer education platform.`,
  };
}

export default function CourseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
