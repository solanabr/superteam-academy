'use client';

/**
 * Landing Footer — branded footer with nav links, social icons, and large title.
 */
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const NAV_LINKS = [
    { i18nKey: 'aboutUs', href: '#about' },
    { i18nKey: 'terms', href: '#terms' },
    { i18nKey: 'privacy', href: '#privacy' },
    { i18nKey: 'contactUs', href: '#contact' },
];

export function LandingFooter() {
    const t = useTranslations('landing');
    return (
        <footer className="relative overflow-hidden rounded-t-3xl bg-brand-green-dark px-6 pb-4 pt-8 sm:px-10 sm:pb-6 sm:pt-10">
            {/* Top row — nav links */}
            <nav
                aria-label="Footer navigation"
                className="flex flex-wrap items-center gap-4 border-b border-brand-cream/40 pb-6 sm:gap-6 sm:pb-8"
            >
                {NAV_LINKS.map((link) => (
                    <a
                        key={link.i18nKey}
                        href={link.href}
                        className="font-supreme text-xs font-medium text-brand-cream transition-colors hover:text-white sm:text-sm"
                    >
                        {t(`footer.${link.i18nKey}`)}
                    </a>
                ))}
            </nav>

            {/* Middle — large brand text single line, right-aligned */}
            <div className="pt-8 sm:pt-10">
                <h2 className="w-full font-display text-[clamp(2rem,8vw,6rem)] font-bold leading-[1.05] tracking-tight text-brand-cream">
                    SUPERTEAM ACADEMY
                </h2>
            </div>

            {/* Bottom row — socials left, Solana branding right */}
            <div className="mt-6 flex flex-col-reverse items-start gap-4 border-t border-brand-cream/40 pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                {/* Socials — left */}
                <div className="flex items-center gap-3">
                    {/* Twitter / X */}
                    <a
                        href="https://x.com/SuperteamBR"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter"
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-brand-cream/60 text-brand-cream transition-colors hover:border-brand-cream hover:bg-brand-cream/10"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </a>
                    {/* Discord */}
                    <a
                        href="https://discord.gg/superteambrasil"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Discord"
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-brand-cream/60 text-brand-cream transition-colors hover:border-brand-cream hover:bg-brand-cream/10"
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                    </a>
                </div>

                {/* Solana branding — badge matching hero style */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-cream/40 bg-[#111] px-3 py-1 shadow-[0_0_12px_rgba(0,0,0,0.3)]">
                    <span className="font-supreme text-[10px] font-medium text-brand-cream sm:text-xs">
                        {t('footer.builtOn')}
                    </span>
                    <Image
                        src="/solana-brandkit/Logos/solanaLogo.svg"
                        alt="Solana"
                        width={72}
                        height={16}
                        className="h-3 w-auto sm:h-3.5"
                    />
                </div>
            </div>

            {/* Copyright */}
            <p className="mt-4 font-supreme text-[11px] text-brand-cream/90 sm:text-xs">
                {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
        </footer>
    );
}
