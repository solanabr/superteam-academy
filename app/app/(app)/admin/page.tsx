"use client";

import { PageHeader } from "@/components/app";
import { useIsAdmin, useConfig } from "@/hooks";
import Link from "next/link";
import { Settings, BookOpen, KeyRound, Award, ArrowRight, Key, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const adminSections = [
  {
    href: "/admin/config",
    title: "Config",
    description: "Update backend signer, view platform authority and XP mint.",
    icon: Settings,
    authorityOnly: true,
  },
  {
    href: "/admin/courses",
    title: "Courses",
    description: "Create, update, and manage on-chain courses.",
    icon: BookOpen,
    authorityOnly: true,
  },
  {
    href: "/admin/minters",
    title: "Minters",
    description: "Register or revoke XP minter roles.",
    icon: KeyRound,
    authorityOnly: true,
  },
  {
    href: "/admin/achievements",
    title: "Achievements",
    description: "Create and deactivate achievement types.",
    icon: Award,
    authorityOnly: true,
  },
  {
    href: "/admin/api-keys",
    title: "API Keys",
    description: "Generate admin or client API keys for backend and integrations.",
    icon: Key,
    authorityOnly: true,
  },
];

export default function AdminPage() {
  const { role } = useIsAdmin();
  const { data: config } = useConfig();

  const sections = adminSections.filter(
    (s) => !s.authorityOnly || role === "authority"
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Admin"
        subtitle={
          role
            ? `Logged in as ${role === "authority" ? "Authority" : "Backend signer"}`
            : "Platform administration"
        }
      />

      {/* Content Studio CTA */}
      <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400/20 border-2 border-yellow-400/40">
              <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="font-game text-xl sm:text-2xl">Content Studio</h2>
              <p className="font-game text-muted-foreground text-base sm:text-lg mt-0.5">
                Edit courses, modules, and lessons in Sanity. Content changes appear on the site when published.
              </p>
            </div>
          </div>
          <a href="/studio" target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Button variant="pixel" size="lg" className="font-game text-lg">
              Open Studio
            </Button>
          </a>
        </div>
      </div>

      {config && (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-xl mb-2">Config summary</h2>
          <p className="font-game text-muted-foreground text-sm mb-4">Current on-chain config</p>
          <div className="space-y-3 font-game">
            <div>
              <span className="text-muted-foreground text-sm">Authority:</span>
              <code className="block rounded-lg bg-muted px-2 py-1.5 font-mono text-sm break-all mt-1 border border-border">
                {config.authority.toBase58()}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Backend signer:</span>
              <code className="block rounded-lg bg-muted px-2 py-1.5 font-mono text-sm break-all mt-1 border border-border">
                {config.backendSigner.toBase58()}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">XP mint:</span>
              <code className="block rounded-lg bg-muted px-2 py-1.5 font-mono text-sm break-all mt-1 border border-border">
                {config.xpMint.toBase58()}
              </code>
            </div>
          </div>
        </div>
      )}

      {sections.length > 0 && (
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <div className="h-full p-4 sm:p-5 rounded-2xl border-4 border-border bg-card transition-colors hover:bg-accent/50 hover:border-yellow-400/30">
              <div className="flex flex-row items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted border-2 border-border">
                  <Icon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-game text-lg sm:text-xl flex items-center gap-2">
                    {title}
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </h3>
                  <p className="font-game text-muted-foreground text-sm sm:text-base mt-1">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}

      {role === "backend_signer" && (
        <p className="font-game text-sm text-muted-foreground p-4 rounded-2xl border-2 border-border bg-muted/30">
          As backend signer, you can complete lessons, finalize courses, and
          issue credentials via the backend API. Authority-only actions (config,
          courses, minters, achievements) are managed by the authority wallet.
        </p>
      )}

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-game border-2 border-border">
          {role === "authority" ? "Authority" : "Backend signer"}
        </Badge>
      </div>
    </div>
  );
}
