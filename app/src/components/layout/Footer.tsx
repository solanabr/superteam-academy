export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a1a]/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195]" />
                <div className="absolute inset-[2px] rounded-[6px] bg-[#0a0a1a] flex items-center justify-center">
                  <span className="text-sm font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">SA</span>
                </div>
              </div>
              <span className="text-lg font-bold text-white">
                Superteam <span className="text-[#14F195]">Academy</span>
              </span>
            </div>
            <p className="text-sm text-white/50 max-w-sm">
              The decentralized learning platform for Solana developers. Earn soulbound XP, collect credentials, and level up your on-chain skills.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3">Platform</h3>
            <ul className="space-y-2">
              <li><a href="/courses" className="text-sm text-white/40 hover:text-white/70 transition-colors">Courses</a></li>
              <li><a href="/leaderboard" className="text-sm text-white/40 hover:text-white/70 transition-colors">Leaderboard</a></li>
              <li><a href="/achievements" className="text-sm text-white/40 hover:text-white/70 transition-colors">Achievements</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3">Resources</h3>
            <ul className="space-y-2">
              <li><a href="https://github.com/solanabr/superteam-academy" target="_blank" rel="noopener" className="text-sm text-white/40 hover:text-white/70 transition-colors">GitHub ↗</a></li>
              <li><a href="https://solana.com" target="_blank" rel="noopener" className="text-sm text-white/40 hover:text-white/70 transition-colors">Solana ↗</a></li>
              <li><a href="https://superteam.fun" target="_blank" rel="noopener" className="text-sm text-white/40 hover:text-white/70 transition-colors">Superteam ↗</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30">
            © 2026 Superteam Academy. Built on Solana. Devnet.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
            <span className="text-xs text-white/40">Devnet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
