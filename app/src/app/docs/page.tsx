import type { Metadata } from "next";
import Link from "next/link";
import { DocsPagination } from "@/components/docs";
import { BookOpen, User, Wallet, GraduationCap, Trophy, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation",
};

const sections = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Learn what Superteam Academy is and how to get started in minutes.",
    href: "/docs/getting-started",
  },
  {
    icon: User,
    title: "Account & Profile",
    description: "Create your account, set up your profile, and personalize your experience.",
    href: "/docs/account",
  },
  {
    icon: Wallet,
    title: "Wallet Connection",
    description: "Connect your Solana wallet to unlock on-chain features like XP and credentials.",
    href: "/docs/wallet",
  },
  {
    icon: GraduationCap,
    title: "Learning",
    description: "Browse courses, enroll, complete lessons, and earn XP.",
    href: "/docs/courses",
  },
  {
    icon: Trophy,
    title: "Rewards & Progress",
    description: "Understand the XP system, credentials, achievements, and leaderboard.",
    href: "/docs/xp-and-levels",
  },
  {
    icon: MessageSquare,
    title: "Community",
    description: "Engage with other learners in the forum and help each other.",
    href: "/docs/community-forum",
  },
];

export default function DocsPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Superteam Academy Documentation
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Welcome to the Superteam Academy user guide. This documentation covers
          everything you need to know to use the platform — from creating your
          account to earning on-chain credentials.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <section.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-muted/30 p-6">
        <h2 className="text-lg font-semibold mb-2">Looking for the Admin Manual?</h2>
        <p className="text-sm text-muted-foreground mb-3">
          If you&apos;re deploying or managing a Superteam Academy instance, check the
          admin documentation for setup guides, environment configuration, and technical reference.
        </p>
        <Link
          href="/docs/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Go to Admin Manual →
        </Link>
      </div>

      <DocsPagination />
    </div>
  );
}
