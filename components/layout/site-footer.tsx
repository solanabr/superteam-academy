'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n/i18n-provider';

export function SiteFooter(): JSX.Element {
  const { dictionary } = useI18n();

  return (
    <footer className="border-t border-border/80 bg-card/35">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="space-y-3">
          <p className="text-base font-extrabold">{dictionary.footer.brand}</p>
          <p className="text-xs text-foreground/70">{dictionary.footer.description}</p>
          <p className="text-xs text-foreground/55">{dictionary.footer.subdescription}</p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">{dictionary.footer.product}</p>
          <Link href="/courses" className="block text-foreground/70 transition hover:text-foreground">
            {dictionary.footer.coursesLink}
          </Link>
          <Link href="/leaderboard" className="block text-foreground/70 transition hover:text-foreground">
            {dictionary.footer.leaderboardLink}
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">{dictionary.footer.community}</p>
          <a href="https://x.com/superteamBR" target="_blank" rel="noreferrer" className="block text-foreground/70 transition hover:text-foreground">
            {dictionary.footer.xLabel}
          </a>
          <a href="https://discord.gg/superteam" target="_blank" rel="noreferrer" className="block text-foreground/70 transition hover:text-foreground">
            {dictionary.footer.discordLabel}
          </a>
        </div>

        <div className="space-y-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">{dictionary.footer.newsletter}</p>
          <p className="text-foreground/70">{dictionary.footer.newsletterDesc}</p>
          <form className="flex gap-2 rounded-2xl border border-border/70 bg-background/65 p-1.5">
            <input
              type="email"
              placeholder={dictionary.footer.emailPlaceholder}
              className="input-field border-transparent bg-transparent px-3 py-2 text-xs focus:border-transparent focus:ring-0"
            />
            <button type="button" className="btn-primary px-3 text-xs">
              {dictionary.footer.join}
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}
