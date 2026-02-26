import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] bg-[#020202]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[#1a1a1a] mb-16">

          {/* Brand */}
          <div className="bg-[#020202] p-8 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-6 h-6 bg-[#9945ff] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-black text-sm uppercase tracking-widest group-hover:text-[#9945ff] transition-colors">
                SUPERTEAM ACADEMY
              </span>
            </Link>
            <p className="text-xs font-mono text-[#444] max-w-xs leading-relaxed mb-6">
              The most advanced on-chain learning platform for Solana developers.
              Built by Superteam Brazil. MIT licensed.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#333]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14f195]" />
              PROGRAM: ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
            </div>
          </div>

          {/* Learn */}
          <div className="bg-[#020202] p-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
              // LEARN
            </div>
            <ul className="space-y-3">
              {[
                { href: "/courses", label: "ALL_COURSES" },
                { href: "/courses?track=1", label: "SOLANA_FUNDAMENTALS" },
                { href: "/courses?track=2", label: "ANCHOR_DEV" },
                { href: "/courses?track=3", label: "DEFI_PROTOCOLS" },
                { href: "/courses?track=5", label: "SECURITY_AUDIT" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div className="bg-[#020202] p-8">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
              // PLATFORM
            </div>
            <ul className="space-y-3">
              {[
                { href: "/dashboard", label: "DASHBOARD" },
                { href: "/leaderboard", label: "LEADERBOARD" },
                { href: "/settings", label: "SETTINGS" },
                { href: "https://github.com/solanabr/superteam-academy", label: "GITHUB" },
                { href: "https://twitter.com/SuperteamBR", label: "TWITTER" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest"
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[10px] font-mono text-[#333] uppercase tracking-widest">
            © 2025 SUPERTEAM ACADEMY — MIT LICENSE
          </p>
          <p className="text-[10px] font-mono text-[#333] uppercase tracking-widest">
            BUILT_ON <span className="text-[#9945ff]">SOLANA</span> // OPEN_SOURCE
          </p>
        </div>
      </div>
    </footer>
  );
}