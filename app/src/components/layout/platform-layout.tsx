import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "./navbar";

const Footer = dynamic(
  () => import("./footer").then((m) => ({ default: m.Footer })),
  { ssr: true }
);

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
