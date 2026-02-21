import AppRootLayout, {
  appMetadata,
  appViewport,
} from "@/components/layout/app-root-layout";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = appMetadata;
export const viewport = appViewport;

/** Layout for public marketing pages (landing, onboarding) — no wallet/gamification providers */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppRootLayout>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </AppRootLayout>
  );
}
