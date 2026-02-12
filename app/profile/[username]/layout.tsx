import type { ReactNode } from "react";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

type LayoutProps = { children: ReactNode; params: { username: string } };

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  return createPageMetadata(
    `@${params.username} | Superteam Academy`,
    `Public learner profile for @${params.username}.`,
    `/profile/${params.username}`
  );
}

export default function ProfileLayout({ children }: LayoutProps): JSX.Element {
  return <>{children}</>;
}
