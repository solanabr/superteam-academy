import Link from "next/link";
import { Github, Twitter, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold text-white mb-3">
              Superteam<span className="text-purple-400">.</span>Academy
            </h3>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              Learn Solana development by shipping real code. Open-source, community-driven, and always free.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/AbhijeetKakade2004/superteam-academy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/SuperteamBR"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://discord.gg/superteambrasil"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Learn */}
          <div>
            <h4 className="text-white font-semibold mb-4">Learn</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/courses" className="text-sm text-white/40 hover:text-white transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-sm text-white/40 hover:text-white transition-colors">
                  Core Protocol
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-sm text-white/40 hover:text-white transition-colors">
                  Anchor Framework
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-sm text-white/40 hover:text-white transition-colors">
                  Full Stack dApps
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/leaderboard" className="text-sm text-white/40 hover:text-white transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <a href="https://discord.gg/superteambrasil" target="_blank" className="text-sm text-white/40 hover:text-white transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://twitter.com/SuperteamBR" target="_blank" className="text-sm text-white/40 hover:text-white transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://github.com/AbhijeetKakade2004/superteam-academy" target="_blank" className="text-sm text-white/40 hover:text-white transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://solana.com/docs" target="_blank" className="text-sm text-white/40 hover:text-white transition-colors">
                  Solana Docs
                </a>
              </li>
              <li>
                <a href="https://book.anchor-lang.com" target="_blank" className="text-sm text-white/40 hover:text-white transition-colors">
                  Anchor Book
                </a>
              </li>
              <li>
                <a href="https://docs.metaplex.com" target="_blank" className="text-sm text-white/40 hover:text-white transition-colors">
                  Metaplex
                </a>
              </li>
              <li>
                <a href="https://helius.xyz" target="_blank" className="text-sm text-white/40 hover:text-white transition-colors">
                  Helius
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">
            © 2026 Superteam Academy. Open source under MIT License.
          </p>
          <p className="text-sm text-white/30">
            Built with{" "}
            <span className="text-purple-400">Rust</span>
            {" "}•{" "}
            <span className="text-green-400">Anchor</span>
            {" "}•{" "}
            <span className="text-white/50">Next.js</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
