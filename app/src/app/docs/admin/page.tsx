import type { Metadata } from "next";
import Link from "next/link";
import { DocsPagination } from "@/components/docs";
import {
  Server,
  Database,
  Palette,
  Bug,
  BarChart3,
  Globe,
  Rocket,
  Key,
  BookOpen,
  Languages,
  Code,
  Wrench,
} from "lucide-react";

export const metadata: Metadata = { title: "Admin Manual" };

const sections = [
  {
    icon: Server,
    title: "Architecture",
    description: "Full tech stack overview — frontend, backend, on-chain, infrastructure.",
    href: "/docs/admin/architecture",
  },
  {
    icon: Rocket,
    title: "Project Setup",
    description: "Clone, install, configure, and run the project locally from scratch.",
    href: "/docs/admin/setup",
  },
  {
    icon: Key,
    title: "Environment Variables",
    description: "Every environment variable explained with where to get each value.",
    href: "/docs/admin/env-variables",
  },
  {
    icon: Database,
    title: "Supabase",
    description: "Database schema, RLS policies, migrations, and admin operations.",
    href: "/docs/admin/supabase",
  },
  {
    icon: Palette,
    title: "Sanity CMS",
    description: "Content management — schemas, Sanity Studio, GROQ queries, and content scripts.",
    href: "/docs/admin/sanity",
  },
  {
    icon: Bug,
    title: "Sentry Monitoring",
    description: "Error tracking, replay, performance monitoring, and alert configuration.",
    href: "/docs/admin/sentry",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Google Analytics and PostHog setup — events, user tracking, dashboards.",
    href: "/docs/admin/analytics",
  },
  {
    icon: Globe,
    title: "Solana Program",
    description: "On-chain program architecture, PDAs, instructions, and deployment.",
    href: "/docs/admin/solana",
  },
  {
    icon: Key,
    title: "Authentication",
    description: "OAuth, wallet auth, session management, and admin access control.",
    href: "/docs/admin/auth",
  },
  {
    icon: BookOpen,
    title: "Course Management",
    description: "Creating, reviewing, approving, and publishing courses.",
    href: "/docs/admin/courses",
  },
  {
    icon: Languages,
    title: "Internationalization",
    description: "i18n setup, adding new locales, and translation workflow.",
    href: "/docs/admin/i18n",
  },
  {
    icon: Code,
    title: "API Reference",
    description: "Complete API endpoint documentation with request/response examples.",
    href: "/docs/admin/api",
  },
  {
    icon: Rocket,
    title: "Deployment",
    description: "Deploy to Vercel, CI/CD, domain setup, and production checklist.",
    href: "/docs/admin/deployment",
  },
  {
    icon: Wrench,
    title: "Troubleshooting",
    description: "Common issues, debugging tips, and solutions.",
    href: "/docs/admin/troubleshooting",
  },
];

export default function AdminDocsPage() {
  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
            Admin
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Admin Manual
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Complete technical documentation for deploying, configuring, and
          managing a Superteam Academy instance. This manual covers every
          service, integration, and configuration option in detail.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-8">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>For deployers &amp; administrators:</strong> This manual is designed so that
          even a beginner can clone the repository and deploy a fully functional
          instance. Follow the sections in order for the best experience.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                <section.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {section.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <DocsPagination />
    </div>
  );
}
