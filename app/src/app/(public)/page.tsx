"use client";

import { Hero } from "@/components/landing/Hero";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { LearningPathsSection } from "@/components/landing/LearningPathsSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { CTASection } from "@/components/landing/CTASection";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function HomePage() {
  const { user, profile } = useAuth();

  return (
    <>
      {/* Welcome Back Banner for Logged-in Users */}
      {user && (
        <div className="w-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white text-white dark:text-neutral-900">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-neutral-900/20 flex items-center justify-center text-lg">
                  👋
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    Welcome back, {profile?.display_name || user.email?.split("@")[0] || "Learner"}!
                  </p>
                  <p className="text-xs text-white/70 dark:text-neutral-900/70">
                    Continue your learning journey
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="px-5 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-full text-xs font-semibold hover:bg-white/90 dark:hover:bg-neutral-800 transition-all flex items-center gap-2"
              >
                Go to Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <Hero />

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent my-16 opacity-50" />

      {/* Features (Dark Section) */}
      <FeaturesSection />

      {/* Divider */}
      <div className="w-full h-px bg-neutral-200 dark:bg-neutral-800 my-20" />

      {/* Learning Paths */}
      <LearningPathsSection />

      {/* Divider */}
      <div className="w-full h-px bg-neutral-200 dark:bg-neutral-800 my-20" />

      {/* Social Proof / Stats */}
      <SocialProofSection />

      {/* CTA */}
      <CTASection />
    </>
  );
}
