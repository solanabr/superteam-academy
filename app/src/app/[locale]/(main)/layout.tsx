import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { OnboardingModal } from "@/components/onboarding-modal";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="hero-cream hero-pattern relative min-h-screen flex flex-col">
      {/* Background full-screen */}
      <div className="page-curve-left" aria-hidden />
      <Header />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
      <OnboardingModal />
    </div>
  );
}
