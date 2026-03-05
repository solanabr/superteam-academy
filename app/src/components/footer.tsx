import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/newsletter-form";
import { FooterLogo } from "@/components/footer-logo";
import { FooterSocialIcons } from "@/components/footer-social-icons";

export async function Footer() {
  const t = await getTranslations("landing");

  return (
    <footer className="relative z-10 mt-auto border-t-0 bg-transparent">
      <div className="container py-12">
        {/* Grid: marca | links + redes | newsletter com barra de busca */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Coluna 1: marca + tagline */}
          <div className="lg:col-span-4">
            <FooterLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footerTagline")}
            </p>
          </div>

          {/* Coluna 2: Links rápidos */}
          <div className="flex flex-col items-center lg:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--brand-emerald))]">
              {t("footerQuickLinks")}
            </h3>
            <nav className="mt-4 flex flex-col items-center gap-3">
              <Link
                href="/courses"
                className="rounded-md px-1 py-0.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t("footerCourses")}
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-md px-1 py-0.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t("footerLeaderboard")}
              </Link>
              <a
                href="https://superteam.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-1 py-0.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                Superteam
              </a>
              <a
                href="https://earn.superteam.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-1 py-0.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                Superteam Earn
              </a>
              <a
                href="mailto:contato@superteam.com.br"
                className="rounded-md px-1 py-0.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t("footerContact")}
              </a>
            </nav>
          </div>

          {/* Coluna 3: Newsletter (em cima) + Conecte-se (embaixo) */}
          <div className="flex flex-col gap-10 lg:col-span-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--brand-emerald))]">
                {t("footerNewsletter")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("footerNewsletterDesc")}
              </p>
              <div className="mt-4">
                <NewsletterForm
                  placeholder={t("footerNewsletterPlaceholder")}
                  submitLabel={t("footerSubscribe")}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--brand-emerald))]">
                {t("footerConnect")}
              </h3>
              <FooterSocialIcons />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6">
          <div className="flex flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <span className="footer-copyright font-bold text-[hsl(var(--brand-emerald))]">
              © 2026 SUPERTEAM BRASIL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
