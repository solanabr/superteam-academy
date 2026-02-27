import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, Github } from 'lucide-react';

const footerLinks = {
  platform: [
    { name: 'Courses', href: '/courses' },
    { name: 'Learning Paths', href: '/courses?view=paths' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Achievements', href: '/achievements' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Blog', href: '/blog' },
    { name: 'Community', href: '/community' },
    { name: 'FAQ', href: '/faq' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Partners', href: '/partners' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
};

const socialLinks = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/CapySolBuild',
    icon: Send,
  },
  {
    name: 'Discord',
    href: 'https://discord.gg/CapySolBuild',
    icon: MessageCircle,
  },
  {
    name: 'GitHub',
    href: 'https://github.com/solanabr/capysolbuild-academy',
    icon: Github,
  },
];

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand and newsletter */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <Image src="/logo.png" alt="CapySolBuild Academy" width={32} height={32} />
              <span className="text-xl">CapySolBuild Academy</span>
            </Link>
            <p className="text-muted-foreground mt-4 text-sm">
              The ultimate learning platform for Solana-native developers. From zero to deploying
              production-ready dApps.
            </p>
            <div className="mt-6">
              <p className="text-sm font-medium">Subscribe to our newsletter</p>
              <form className="mt-2 flex gap-2">
                <Input type="email" placeholder="Enter your email" className="max-w-[240px]" />
                <Button type="submit" size="sm">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h3 className="text-sm font-semibold">Platform</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h3 className="text-sm font-semibold">Resources</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom section */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} CapySolBuild Academy. All rights reserved.
            </p>
            <div className="flex gap-4">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <link.icon className="h-5 w-5" />
                <span className="sr-only">{link.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
