import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
