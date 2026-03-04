"use client";

import { usePathname } from "@/i18n/navigation";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { PlatformLayout } from "./platform-layout";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isPublic = isLanding || pathname === "/login" || pathname.startsWith("/auth");

  if (isPublic) {
    return (
      <div className={`flex min-h-screen flex-col ${isLanding ? "landing-force-dark" : ""}`}>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    );
  }

  return <PlatformLayout>{children}</PlatformLayout>;
}
