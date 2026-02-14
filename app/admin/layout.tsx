import type { ReactNode } from "react";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata(
  "Admin Courses | Superteam Academy",
  "Manage courses and lesson ordering.",
  "/admin/courses"
);

export default function AdminLayout({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}
