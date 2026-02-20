"use client";

import type { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

interface PlatformLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function PlatformLayout({ children, hideFooter }: PlatformLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
