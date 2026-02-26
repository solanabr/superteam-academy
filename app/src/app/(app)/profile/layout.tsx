import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "View your Superteam Academy learner profile, achievements, skill radar, on-chain credentials, and completed courses.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
