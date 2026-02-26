"use client";

import { Navbar } from "./navbar";
import { Footer } from "./footer";

interface PageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  className?: string;
}

export function PageLayout({
  children,
  showFooter = true,
  className,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 ${className ?? ""}`}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
