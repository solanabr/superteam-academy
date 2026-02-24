import type { Metadata } from "next";
import { CatalogSection } from "@/components/landing/catalog-section";
import { fetchCourses } from "@/lib/fetch-courses";

export const metadata: Metadata = {
  title: "Course Catalog",
  description: "Browse Solana development courses by track and difficulty. Earn XP and on-chain credentials.",
};

export default async function CourseCatalogPage() {
  const courses = await fetchCourses();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <CatalogSection initialCourses={courses} />
    </div>
  );
}
