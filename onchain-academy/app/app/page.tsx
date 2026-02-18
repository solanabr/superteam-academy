import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { GamificationShowcase } from "@/components/landing/gamification-showcase";
import { LearningPaths } from "@/components/landing/learning-paths";
import { Testimonials } from "@/components/landing/testimonials";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-neon-green/30 selection:text-neon-green">
      <Navigation />

      <div className="flex flex-col">
        <Hero />
        <Stats />
        <Features />
        <GamificationShowcase />
        <LearningPaths />
        <Testimonials />
        <CTASection />
      </div>

      <Footer />
    </main>
  );
}
