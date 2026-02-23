import type { Metadata } from "next";

const BASE_URL = "https://superteam-academy.vercel.app";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your Superteam Academy account settings, display preferences, and wallet configuration.",
  openGraph: {
    title: "Settings | Superteam Academy",
    description:
      "Manage your Superteam Academy account settings, display preferences, and wallet configuration.",
  },
  alternates: {
    canonical: `${BASE_URL}/en/settings`,
    languages: {
      en: "/en/settings",
      "pt-BR": "/pt-br/settings",
      es: "/es/settings",
    },
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
