import type { ReactNode } from "react";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata(
  "Dashboard | Superteam Academy",
  "Track XP, levels, streaks, and course progress.",
  "/dashboard"
);

export default function DashboardLayout({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}
