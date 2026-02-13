import { Link } from '@/i18n/routing';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/60 backdrop-blur-xl">
      <div className="container py-16 md:py-24">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-[0_0_18px_rgba(20,241,149,0.25)]">
                SA
              </div>
              <span className="font-black text-lg tracking-tighter uppercase">
                Superteam Academy
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Master Solana development through interactive, gamified learning. Earn on-chain credentials and join the elite.
            </p>
          </div>
          <div>
            <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Learn</h3>
            <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest">
              <li><Link href="/courses" className="text-muted-foreground hover:text-primary transition-colors">All Courses</Link></li>
              <li><Link href="/courses?difficulty=beginner" className="text-muted-foreground hover:text-primary transition-colors">Beginner</Link></li>
              <li><Link href="/courses?difficulty=intermediate" className="text-muted-foreground hover:text-primary transition-colors">Intermediate</Link></li>
              <li><Link href="/courses?difficulty=advanced" className="text-muted-foreground hover:text-primary transition-colors">Advanced</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Community</h3>
            <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest">
              <li><Link href="/leaderboard" className="text-muted-foreground hover:text-primary transition-colors">Leaderboard</Link></li>
              <li><Link href="/community" className="text-muted-foreground hover:text-primary transition-colors">Forum</Link></li>
              <li><Link href="/credentials" className="text-muted-foreground hover:text-primary transition-colors">Credentials</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Resources</h3>
            <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest">
              <li><a href="https://docs.solana.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Solana Docs</a></li>
              <li><a href="https://superteam.fun" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Superteam</a></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest">
            <a href="https://twitter.com/superteamdao" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Twitter</a>
            <a href="https://discord.gg/superteam" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Discord</a>
            <a href="https://github.com/superteamdao" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">GitHub</a>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            &copy; {new Date().getFullYear()} Superteam DAO
          </p>
        </div>
      </div>
    </footer>
  );
}
