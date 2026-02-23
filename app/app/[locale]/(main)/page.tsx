import { HeroSection } from "@/components/landing/hero-section";
import { FeatureCards } from "@/components/landing/feature-cards";
import { Footer } from "@/components/landing/footer";
import { CatalogSection } from "@/components/landing/catalog-section";
import { fetchCourses } from "@/lib/fetch-courses";

export default async function CatalogPage() {
  const courses = await fetchCourses();

  return (
    <>
      <HeroSection />
      <FeatureCards />
      <CatalogSection initialCourses={courses} />
      <Footer />
    </>
  );
}
