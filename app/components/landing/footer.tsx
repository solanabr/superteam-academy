import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useTranslations, useLocale } from "next-intl";
import { Newsletter } from "./newsletter";

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  const footerLinks = {
    platform: {
      label: t("footer.platform"),
      links: [
        { label: t("nav.courses"), href: `/${locale}/courses` },
        { label: t("nav.leaderboard"), href: `/${locale}/leaderboard` },
        { label: t("nav.dashboard"), href: `/${locale}/dashboard` },
      ],
    },
    resources: {
      label: t("footer.resources"),
      links: [
        { label: t("footer.documentation"), href: "#" },
        { label: "GitHub", href: "https://github.com/solanabr/superteam-academy" },
        { label: t("footer.solanaDocs"), href: "https://solana.com/docs" },
      ],
    },
    community: {
      label: t("footer.community"),
      links: [
        { label: "Superteam", href: "https://superteam.fun" },
        { label: "Discord", href: "#" },
        { label: "Twitter", href: "#" },
      ],
    },
  };

  return (
    <footer className="bg-muted/30">
      <div className="mx-auto max-w-6xl px-8 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="text-sm font-semibold text-foreground">
              {t("common.brandName")}
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="mt-4">
              <Newsletter />
            </div>
          </div>

          {Object.values(footerLinks).map((section) => (
            <div key={section.label}>
              <span className="text-sm font-medium text-foreground">
                {section.label}
              </span>
              <ul className="mt-3 flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {t("common.openSource")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("common.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
