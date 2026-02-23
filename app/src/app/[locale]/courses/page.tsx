import type { Metadata } from "next";
import { fetchCourses } from "@/lib/services/courses";
import CourseCatalog from "./course-catalog";

const BASE_URL = "https://superteam-academy.vercel.app";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse Solana development courses. Learn Rust, Anchor, DeFi, and more with hands-on coding challenges.",
  openGraph: {
    title: "Courses | Superteam Academy",
    description:
      "Browse Solana development courses. Learn Rust, Anchor, DeFi, and more with hands-on coding challenges.",
  },
  alternates: {
    canonical: `${BASE_URL}/en/courses`,
    languages: {
      en: "/en/courses",
      "pt-BR": "/pt-br/courses",
      es: "/es/courses",
    },
  },
};

export default async function CourseCatalogPage() {
  const courses = await fetchCourses();

  return <CourseCatalog courses={courses} />;
}
