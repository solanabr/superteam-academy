import Link from "next/link";
import { Github, Twitter } from "lucide-react";

const navLinks = [
  { label: "Courses", href: "/courses" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Settings", href: "/settings" },
];

const resourceLinks = [
  { label: "Solana Docs", href: "https://solana.com/docs", external: true },
  { label: "Anchor Book", href: "https://www.anchor-lang.com", external: true },
  { label: "Metaplex Docs", href: "https://developers.metaplex.com", external: true },
  { label: "Superteam", href: "https://superteam.fun", external: true },
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com/solanabr/superteam-academy", icon: Github },
  { label: "Twitter", href: "https://twitter.com/superabordo", icon: Twitter },
];

export function Footer(): JSX.Element {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="text-lg font-bold">
              <span className="solana-gradient-text">Superteam</span> Academy
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The open-source, gamified learning platform for Solana developers. Built by Superteam Brazil.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-solana-purple/40 hover:text-foreground"
                  aria-label={link.label}
                >
                  <link.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="mb-3 text-sm font-semibold">Platform</p>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="mb-3 text-sm font-semibold">Resources</p>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div>
            <p className="mb-3 text-sm font-semibold">Start Building</p>
            <p className="mb-3 text-sm text-muted-foreground">
              Free, open-source, and community-driven. Jump in and start learning Solana today.
            </p>
            <Link
              href="/courses"
              className="inline-flex h-9 items-center rounded-md bg-solana-purple px-4 text-sm font-medium text-white transition-colors hover:bg-solana-purple/90"
            >
              Browse Courses
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Superteam Academy. MIT License.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with{" "}
            <span className="solana-gradient-text font-medium">Solana</span>
            {" "}&middot;{" "}Next.js &middot; Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}
