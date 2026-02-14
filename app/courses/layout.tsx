import type { ReactNode } from "react";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata(
  "Courses | Superteam Academy",
  "Browse Solana developer courses by difficulty and topic.",
  "/courses"
);

export default function CoursesLayout({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}
