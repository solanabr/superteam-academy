import { WalletProvider } from "@/components/layout/wallet-provider";
import { AppHeader } from "@/components/layout/app-header";
import { Footer } from "@/components/layout/footer";
import { LearningProgressProvider } from "@/lib/hooks/use-learning-progress";
import { XPNotificationProvider } from "@/components/gamification/xp-notification";
import { GamificationProvider } from "@/lib/hooks/use-gamification";
import { CoursesProvider } from "@/lib/hooks/use-courses";

/** Layout for authenticated app pages — includes wallet, gamification, and progress providers */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <CoursesProvider>
      <LearningProgressProvider>
        <GamificationProvider>
          <XPNotificationProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
            >
              Skip to content
            </a>
            <div className="relative flex min-h-screen flex-col">
              <AppHeader />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </XPNotificationProvider>
        </GamificationProvider>
      </LearningProgressProvider>
      </CoursesProvider>
    </WalletProvider>
  );
}
