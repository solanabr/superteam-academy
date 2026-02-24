import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse interactive Solana development courses. Learn Anchor, Rust, DeFi, Token Engineering, and more with hands-on challenges and on-chain credentials.",
  openGraph: {
    title: "Courses | Superteam Academy",
    description:
      "Browse interactive Solana development courses with hands-on challenges and on-chain credentials.",
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
