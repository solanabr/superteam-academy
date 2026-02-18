"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Github, Twitter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const footerLinks = [
  {
    titleKey: "platform" as const,
    links: [
      { labelKey: "courses" as const, href: "/courses" },
      { labelKey: "dashboard" as const, href: "/dashboard" },
      { labelKey: "leaderboard" as const, href: "/leaderboard" },
      { labelKey: "certificates" as const, href: "/certificates/cert-sol-001" },
    ],
  },
  {
    titleKey: "resources" as const,
    links: [
      { labelKey: "docs" as const, href: "#" },
      { labelKey: "blog" as const, href: "#" },
      { labelKey: "community" as const, href: "#" },
      { labelKey: "support" as const, href: "#" },
    ],
  },
  {
    titleKey: "company" as const,
    links: [
      { labelKey: "about" as const, href: "#" },
      { labelKey: "careers" as const, href: "#" },
      { labelKey: "privacy" as const, href: "#" },
      { labelKey: "terms" as const, href: "#" },
    ],
  },
];

export function Footer() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("subscribedThankYou"));
    setEmail("");
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="logo" width={128} height={164} />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm">
              {t("description")}
            </p>
            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                {t("subscribe")}
              </Button>
            </form>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.titleKey}>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                {t(section.titleKey)}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {section.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            2026 SuperTeam. {t("copyright")}
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Twitter</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
