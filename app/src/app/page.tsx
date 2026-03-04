import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { LearningPathsSection } from "@/components/landing/learning-paths-section";
import { StatsSection } from "@/components/landing/stats-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CTASection } from "@/components/landing/cta-section";
import { PartnersSection } from "@/components/landing/partners-section";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturesSection />
      <LearningPathsSection />
      <StatsSection />
      <TestimonialsSection />
      <PartnersSection />
      <CTASection />
    </div>
  );
}
