import type { ReactNode } from "react";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata(
  "Settings | Superteam Academy",
  "Manage profile, privacy, language, and theme settings.",
  "/settings"
);

export default function SettingsLayout({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}
