'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Separator } from '@/components/ui/separator';
import { GraduationCap } from 'lucide-react';

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

/**
 * Inline Solana logo SVG for the "Built on Solana" badge.
 * Simplified version of the Solana brand mark with gradient.
 */
function SolanaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 397.7 311.7"
      fill="none"
      aria-hidden="true"
    >
      <linearGradient
        id="solana-footer-a"
        x1="360.879"
        x2="141.213"
        y1="351.455"
        y2="-69.294"
        gradientTransform="matrix(1 0 0 -1 0 314)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#00ffa3" />
        <stop offset="1" stopColor="#dc1fff" />
      </linearGradient>
      <path
        d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"
        fill="url(#solana-footer-a)"
      />
      <linearGradient
        id="solana-footer-b"
        x1="264.829"
        x2="45.163"
        y1="401.601"
        y2="-19.148"
        gradientTransform="matrix(1 0 0 -1 0 314)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#00ffa3" />
        <stop offset="1" stopColor="#dc1fff" />
      </linearGradient>
      <path
        d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"
        fill="url(#solana-footer-b)"
      />
      <linearGradient
        id="solana-footer-c"
        x1="312.548"
        x2="92.882"
        y1="376.688"
        y2="-44.061"
        gradientTransform="matrix(1 0 0 -1 0 314)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#00ffa3" />
        <stop offset="1" stopColor="#dc1fff" />
      </linearGradient>
      <path
        d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
        fill="url(#solana-footer-c)"
      />
    </svg>
  );
}

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const socialLinks: SocialLink[] = [
  {
    label: 'Twitter',
    href: 'https://twitter.com/SuperteamDAO',
    icon: XIcon,
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/superteam',
    icon: DiscordIcon,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/superteam-fun',
    icon: GitHubIcon,
  },
];

export function Footer() {
  const nav = useTranslations('nav');
  const t = useTranslations('footer');

  const columns: FooterColumn[] = [
    {
      title: t('column_platform'),
      links: [
        { label: nav('courses'), href: '/courses' },
        { label: nav('leaderboard'), href: '/leaderboard' },
        { label: nav('community'), href: '/community' },
        { label: nav('dashboard'), href: '/dashboard' },
      ],
    },
    {
      title: t('column_resources'),
      links: [
        { label: t('link_documentation'), href: '/docs' },
        {
          label: 'GitHub',
          href: 'https://github.com/superteam-fun',
          external: true,
        },
        {
          label: t('link_solana_docs'),
          href: 'https://solana.com/docs',
          external: true,
        },
        {
          label: 'Superteam',
          href: 'https://superteam.fun',
          external: true,
        },
      ],
    },
    {
      title: t('column_legal'),
      links: [
        { label: t('link_terms'), href: '/terms' },
        { label: t('link_privacy'), href: '/privacy' },
        { label: t('link_contact'), href: '/contact' },
      ],
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t bg-background"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              aria-label="Superteam Academy home"
            >
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Superteam Academy</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {t('brand_tagline')}
            </p>
          </div>

          {/* Columns 2-4: Link Groups */}
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3" role="list">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            {t('copyright', { year: currentYear })}
          </p>

          {/* Built on Solana Badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/50 px-3 py-1">
            <SolanaLogo className="h-3.5 w-3.5" />
            <span className="text-xs font-medium text-muted-foreground">
              {t('built_on_solana')}
            </span>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                  aria-label={social.label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
