import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getFeaturedCourses, SanityCourse } from "@/lib/sanity/queries";
import { LandingContent } from "@/components/landing/LandingContent";

type Props = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  const tLanding = await getTranslations({ locale, namespace: "landing" });
  const title = t("appName");
  const description = tLanding("hero.subtitle");
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let featuredCourses: SanityCourse[] = [];
  try {
    featuredCourses = await getFeaturedCourses(locale, 3);
  } catch {
    // Sanity not configured — skip featured section
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://superteam-academy.vercel.app/#website",
        name: "Superteam Academy",
        description: "Learn Solana development, earn on-chain credentials",
        url: "https://superteam-academy.vercel.app",
        inLanguage: ["pt-BR", "en", "es"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://superteam-academy.vercel.app/courses?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "EducationalOrganization",
        "@id": "https://superteam-academy.vercel.app/#organization",
        name: "Superteam Academy",
        description:
          "A decentralized learning platform on Solana. Complete courses, earn on-chain XP, and receive soulbound credential NFTs.",
        url: "https://superteam-academy.vercel.app",
        logo: {
          "@type": "ImageObject",
          url: "https://superteam-academy.vercel.app/icons/icon-512x512.png",
        },
        sameAs: ["https://superteam.fun"],
        knowsAbout: [
          "Solana blockchain development",
          "Web3 education",
          "Smart contract programming",
          "Decentralized finance",
          "NFT development",
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Solana Developer Courses",
          url: "https://superteam-academy.vercel.app/courses",
        },
        areaServed: [
          { "@type": "Country", name: "Brazil" },
          { "@type": "Country", name: "United States" },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingContent featuredCourses={featuredCourses} />
    </>
  );
}
