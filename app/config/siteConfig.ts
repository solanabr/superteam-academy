import { Metadata } from "next";

const BASE_URL = "https://brasil.superteam.life";

const { title, description, ogImage } = {
  title: "Superteam Brasil | Comunidade Solana no Brasil",
  description:
    "Superteam Brasil é a comunidade Solana no Brasil. Aprenda, construa e cresça no ecossistema Solana com cursos, bounties e uma rede de builders e criadores.",
  ogImage: `${BASE_URL}/open-graph.png`,
};

export const siteConfig: Metadata = {
  title: {
    default: title,
    template: "%s | Superteam Brasil",
  },
  description,
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE_URL,
    siteName: "Superteam Brasil",
    title,
    description,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Superteam Brasil — Comunidade Solana no Brasil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
  icons: {
    icon: "/favicon.ico",
  },
  applicationName: "Superteam Brasil",
  alternates: {
    canonical: BASE_URL,
  },
  keywords: [
    "Superteam Brasil",
    "Solana Brasil",
    "comunidade Solana",
    "Solana ecosystem",
    "crypto Brasil",
    "Web3 Brasil",
    "blockchain Brasil",
    "Superteam",
    "Solana builders",
    "brasil.superteam.life",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};
