'use client';

import Link from 'next/link';
import { Github, Twitter, MessageCircle, ExternalLink } from 'lucide-react';
import { APP_CONFIG } from '@/config/constants';

const footerLinks = {
  platform: [
    { label: 'Courses', href: '/courses' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Certificates', href: '/profile' },
  ],
  resources: [
    { label: 'Solana Docs', href: 'https://solana.com/docs', external: true },
    { label: 'Anchor Book', href: 'https://www.anchor-lang.com/', external: true },
    { label: 'Metaplex Docs', href: 'https://developers.metaplex.com/', external: true },
    { label: 'Solana Cookbook', href: 'https://solanacookbook.com/', external: true },
  ],
  community: [
    { label: 'GitHub', href: APP_CONFIG.github, external: true },
    { label: 'Discord', href: APP_CONFIG.discord, external: true },
    { label: 'Twitter', href: `https://twitter.com/${APP_CONFIG.twitter}`, external: true },
    { label: 'Superteam Brazil', href: 'https://superteam.fun', external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] text-white font-bold">
                Q
              </div>
              <span className="text-lg font-bold">
                <span className="text-foreground">Solana</span>
                <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                  Quest
                </span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-[240px]">
              Your RPG adventure into Solana development. Level up your skills and earn on-chain
              credentials.
            </p>
            <div className="flex gap-3">
              <a
                href={APP_CONFIG.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href={`https://twitter.com/${APP_CONFIG.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href={APP_CONFIG.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Community</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/40 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Solana Quest by Superteam Brazil. Open source under
            MIT License.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Powered by</span>
            <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent font-semibold">
              Solana
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
