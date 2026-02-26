import { PageLayout } from "@/components/layout/page-layout";
import { Hero } from "@/components/landing/hero";
import { TechMarquee } from "@/components/landing/tech-marquee";
import { Features } from "@/components/landing/features";
import { CoursePreview } from "@/components/landing/course-preview";
import { Testimonials } from "@/components/landing/testimonials";
import { CTASection } from "@/components/landing/cta-section";

export default function Home() {
  return (
    <PageLayout>
      <Hero />
      <TechMarquee />
      <Features />
      <CoursePreview />
      <Testimonials />
      <CTASection />
    </PageLayout>
  );
}
