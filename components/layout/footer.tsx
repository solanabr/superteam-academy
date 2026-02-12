import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-sm font-semibold">Learn</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/courses" className="hover:text-foreground transition-colors">All Courses</Link></li>
              <li><Link href="/courses?difficulty=beginner" className="hover:text-foreground transition-colors">Beginner</Link></li>
              <li><Link href="/courses?difficulty=intermediate" className="hover:text-foreground transition-colors">Intermediate</Link></li>
              <li><Link href="/courses?difficulty=advanced" className="hover:text-foreground transition-colors">Advanced</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Community</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link></li>
              <li><Link href="/community" className="hover:text-foreground transition-colors">Forum</Link></li>
              <li><Link href="/credentials" className="hover:text-foreground transition-colors">Credentials</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="https://docs.solana.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Solana Docs</a></li>
              <li><a href="https://superteam.fun" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Superteam</a></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">About</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Superteam Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
