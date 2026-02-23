import { HeroSection } from "@/components/landing/hero-section";
import { FeatureCards } from "@/components/landing/feature-cards";
import { Footer } from "@/components/landing/footer";
import { CatalogSection } from "@/components/landing/catalog-section";

export default function CatalogPage() {
  return (
    <>
      <HeroSection />
      <FeatureCards />
      <CatalogSection />
      <Footer />
    </>
  );
}
