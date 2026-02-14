import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold">Platform</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">Courses</Link></li>
              <li><Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground">Leaderboard</Link></li>
              <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Learning Paths</h3>
            <ul className="mt-4 space-y-2">
              <li><span className="text-sm text-muted-foreground">Anchor Framework</span></li>
              <li><span className="text-sm text-muted-foreground">Rust for Solana</span></li>
              <li><span className="text-sm text-muted-foreground">DeFi Development</span></li>
              <li><span className="text-sm text-muted-foreground">Program Security</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Community</h3>
            <ul className="mt-4 space-y-2">
              <li><span className="text-sm text-muted-foreground">Discord</span></li>
              <li><span className="text-sm text-muted-foreground">Twitter</span></li>
              <li><span className="text-sm text-muted-foreground">GitHub</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Resources</h3>
            <ul className="mt-4 space-y-2">
              <li><span className="text-sm text-muted-foreground">Documentation</span></li>
              <li><span className="text-sm text-muted-foreground">Blog</span></li>
              <li><span className="text-sm text-muted-foreground">Changelog</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/image.png" alt="Superteam Academy" width={32} height={32} className="rounded-lg" />
            <span className="text-sm font-semibold">Superteam Academy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built on Solana. Powered by Superteam.
          </p>
        </div>
      </div>
    </footer>
  );
}
