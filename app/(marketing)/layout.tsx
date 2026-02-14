import type { ReactNode } from "react";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata(
  "Superteam Academy | Solana Learning",
  "Interactive Solana learning paths with challenges and on-chain credentials.",
  "/"
);

export default function MarketingLayout({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}
