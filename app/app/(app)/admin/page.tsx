"use client";

import { PageHeader } from "@/components/app";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsAdmin, useConfig } from "@/hooks";
import Link from "next/link";
import { Settings, BookOpen, KeyRound, Award, ArrowRight, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        subtitle={
          role
            ? `Logged in as ${role === "authority" ? "Authority" : "Backend signer"}`
            : "Platform administration"
        }
      />

      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Config summary</CardTitle>
            <CardDescription>Current on-chain config</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Authority:</span>
              <code className="block rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all mt-1">
                {config.authority.toBase58()}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground">Backend signer:</span>
              <code className="block rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all mt-1">
                {config.backendSigner.toBase58()}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground">XP mint:</span>
              <code className="block rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all mt-1">
                {config.xpMint.toBase58()}
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      {sections.length > 0 && (
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/30">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    {title}
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription className="mt-1">{description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      )}

      {role === "backend_signer" && (
        <p className="text-sm text-muted-foreground">
          As backend signer, you can complete lessons, finalize courses, and
          issue credentials via the backend API. Authority-only actions (config,
          courses, minters, achievements) are managed by the authority wallet.
        </p>
      )}

      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {role === "authority" ? "Authority" : "Backend signer"}
        </Badge>
      </div>
    </div>
  );
}
