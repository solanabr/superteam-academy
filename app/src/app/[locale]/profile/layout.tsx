import type { Metadata } from "next";

const BASE_URL = "https://superteam-academy.vercel.app";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "View your Solana developer profile. Track skills, credentials, achievements, and learning activity.",
  openGraph: {
    title: "Profile | Superteam Academy",
    description:
      "View your Solana developer profile. Track skills, credentials, achievements, and learning activity.",
  },
  alternates: {
    canonical: `${BASE_URL}/en/profile`,
    languages: {
      en: "/en/profile",
      "pt-BR": "/pt-br/profile",
      es: "/es/profile",
    },
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
