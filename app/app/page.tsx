"use client";

import {
  HeroSection,
  FeaturesSection,
  StatsSection,
  CoursesSection,
  AssessmentSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <CoursesSection />
        <AssessmentSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
