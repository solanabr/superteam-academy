/**
 * @fileoverview Landing page layout.
 * Composes the primary marketing sections in a single-column stack.
 * Below-the-fold sections use dynamic imports to reduce initial JS bundle.
 */
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { Partners } from "@/components/landing/Partners";
import { Footer } from "@/components/layout/Footer";

// Dynamic imports for below-the-fold sections to reduce initial JS bundle
const LearningPaths = dynamic(
	() =>
		import("@/components/landing/LearningPaths").then(
			(mod) => mod.LearningPaths,
		),
	{ ssr: true },
);
const Features = dynamic(
	() => import("@/components/landing/Features").then((mod) => mod.Features),
	{ ssr: true },
);
const Testimonials = dynamic(
	() =>
		import("@/components/landing/Testimonials").then((mod) => mod.Testimonials),
	{ ssr: true },
);
const Newsletter = dynamic(
	() => import("@/components/landing/Newsletter").then((mod) => mod.Newsletter),
	{ ssr: true },
);

export default function Home() {
	return (
		<main className="min-h-screen bg-bg-base text-ink-primary font-mono selection:bg-ink-primary selection:text-bg-base">
			{/* Navigation Bar - Sticky Global Header */}
			<Navbar />

			{/* Hero Section - Main Value Proposition */}
			<Hero />

			{/* Stats Strip - Social Proof / Key Metrics */}
			<StatsStrip />

			{/* Learning Paths - Course Categories */}
			<LearningPaths />

			{/* Institutional Partners */}
			<Partners />

			{/* Key Features / Benefits */}
			<Features />

			{/* Student Testimonials */}
			<Testimonials />

			{/* Newsletter Signup */}
			<Newsletter />

			{/* Global Footer */}
			<Footer />
		</main>
	);
}
