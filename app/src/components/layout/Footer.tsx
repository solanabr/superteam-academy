import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/courses", label: "Curriculum" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
];

export function Footer() {
  return (
    <footer className="glass-panel border-border-subtle relative z-10 mt-auto border-t">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="shrink-0">
            <Image
              src="/logo/logo-horizontal.svg"
              alt="Superteam Academy"
              width={120}
              height={28}
              className="h-7 w-auto opacity-90"
            />
          </Link>
          <nav className="flex flex-wrap gap-6" aria-label="Footer">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-text-secondary hover:text-text-primary text-sm transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="text-text-secondary mt-6 flex flex-col gap-4 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs">
            Decentralized learning on Solana. Superteam Brazil.
          </p>
          <div className="flex gap-4">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-solana text-xs transition-colors"
              aria-label="X (Twitter)"
            >
              X
            </a>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-solana text-xs transition-colors"
              aria-label="Discord"
            >
              Discord
            </a>
          </div>
        </div>
        <div className="text-text-secondary mt-4">
          <div className="flex max-w-xs gap-2" aria-label="Newsletter (stub)">
            <input
              type="email"
              placeholder="Email for updates"
              className="border-border-subtle bg-surface-high text-text-primary placeholder:text-text-secondary w-full rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-solana/50"
              disabled
              readOnly
              aria-hidden
            />
            <span className="shrink-0 rounded bg-solana px-3 py-2 text-sm font-medium text-void opacity-60">
              Subscribe
            </span>
          </div>
          <p className="mt-1 text-xs opacity-75">Newsletter coming soon.</p>
        </div>
      </div>
    </footer>
  );
}
