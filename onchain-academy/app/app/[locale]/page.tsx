import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Superteam Academy - Learn Solana Development",
  description: "Learn to build on Solana. Earn on-chain XP and credential NFTs. Interactive courses, coding challenges, and verified credentials.",
  keywords: ["Solana", "Web3", "Blockchain", "Development", "Courses", "Learning", "Anchor", "Rust"],
};

export default function LandingPage() {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased font-sans bg-background text-foreground">
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between mx-auto max-w-6xl px-4">
            <div className="flex items-center gap-6">
              <a href="/en" className="flex items-center space-x-2 font-bold text-lg">Superteam Academy</a>
              <nav className="hidden md:flex items-center gap-1 text-sm">
                <a href="/en/courses" className="px-3 py-2 hover:text-primary transition-colors">Courses</a>
                <a href="/en/leaderboard" className="px-3 py-2 hover:text-primary transition-colors">Leaderboard</a>
                <a href="/en/dashboard" className="px-3 py-2 hover:text-primary transition-colors">Dashboard</a>
                <a href="/en/community" className="px-3 py-2 hover:text-primary transition-colors">Community</a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <a href="/en/onboarding" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">Get Started</a>
            </div>
          </div>
        </header>

        <main>
          <section className="py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="max-w-3xl">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground mb-6">Start Learning Free</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  Learn to Build on <span className="text-primary">Solana</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                  Master Solana development through interactive courses. Earn soulbound XP tokens and verifiable credential NFTs.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="/en/onboarding" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 py-2.5 px-6">Start Learning Free →</a>
                  <a href="/en/courses" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 py-2.5 px-6">Explore Courses</a>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 border-y bg-muted/30">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div><div className="text-3xl font-bold text-primary">12+</div><div className="text-sm text-muted-foreground mt-1">Courses</div></div>
                <div><div className="text-3xl font-bold text-primary">150+</div><div className="text-sm text-muted-foreground mt-1">Lessons</div></div>
                <div><div className="text-3xl font-bold text-primary">2.4M</div><div className="text-sm text-muted-foreground mt-1">XP Distributed</div></div>
                <div><div className="text-3xl font-bold text-primary">850+</div><div className="text-sm text-muted-foreground mt-1">Credentials</div></div>
              </div>
            </div>
          </section>

          <section className="py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Why Superteam Academy</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-lg border bg-card p-6">
                  <div className="text-3xl mb-3">📚</div>
                  <h3 className="font-semibold mb-2">Interactive Courses</h3>
                  <p className="text-sm text-muted-foreground">Hands-on Solana development with in-browser coding challenges.</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <div className="text-3xl mb-3">⛓️</div>
                  <h3 className="font-semibold mb-2">On-Chain XP</h3>
                  <p className="text-sm text-muted-foreground">Earn soulbound Token-2022 XP for every lesson completed.</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <div className="text-3xl mb-3">🏆</div>
                  <h3 className="font-semibold mb-2">Credential NFTs</h3>
                  <p className="text-sm text-muted-foreground">Receive Metaplex Core NFTs as proof of mastery.</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <div className="text-3xl mb-3">🔐</div>
                  <h3 className="font-semibold mb-2">Decentralized</h3>
                  <p className="text-sm text-muted-foreground">Course enrollments recorded on-chain.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto max-w-6xl px-4">
              <h2 className="text-3xl font-bold text-center mb-4">What Learners Say</h2>
              <p className="text-center text-muted-foreground mb-12">Join hundreds of developers building on Solana</p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-lg border bg-card p-6">
                  <p className="text-muted-foreground mb-4 italic">"Superteam Academy took me from zero to deploying my first Solana program in just 2 weeks."</p>
                  <div className="font-semibold">Alex Chen</div>
                  <div className="text-sm text-muted-foreground">DeFi Developer</div>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <p className="text-muted-foreground mb-4 italic">"The on-chain credentials are game-changing. My NFT helped me land interviews."</p>
                  <div className="font-semibold">Maria Santos</div>
                  <div className="text-sm text-muted-foreground">Frontend Engineer</div>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <p className="text-muted-foreground mb-4 italic">"Best Web3 learning platform I've used. The XP system keeps you motivated."</p>
                  <div className="font-semibold">Dev Kumar</div>
                  <div className="text-sm text-muted-foreground">Full-Stack Developer</div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Learning Paths</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-lg border bg-card p-6">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-4 bg-green-500/10 text-green-500 border-green-500/20">Beginner</span>
                  <h3 className="font-semibold text-lg mb-2">Solana Fundamentals</h3>
                  <p className="text-sm text-muted-foreground mb-4">Accounts, transactions, PDAs, and the Solana programming model from scratch.</p>
                  <div className="flex gap-4 text-xs text-muted-foreground"><span>12 lessons</span><span>1,200 XP</span></div>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Intermediate</span>
                  <h3 className="font-semibold text-lg mb-2">Anchor Development</h3>
                  <p className="text-sm text-muted-foreground mb-4">Build, test, and deploy Solana programs using the Anchor framework.</p>
                  <div className="flex gap-4 text-xs text-muted-foreground"><span>16 lessons</span><span>2,400 XP</span></div>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-4 bg-red-500/10 text-red-500 border-red-500/20">Advanced</span>
                  <h3 className="font-semibold text-lg mb-2">Token Engineering</h3>
                  <p className="text-sm text-muted-foreground mb-4">Token-2022 extensions, Metaplex Core, soulbound tokens, and token economics.</p>
                  <div className="flex gap-4 text-xs text-muted-foreground"><span>10 lessons</span><span>2,000 XP</span></div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t py-8">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">Built on Solana. Open source.</p>
              <p className="text-sm text-muted-foreground">© 2026 Superteam Brazil</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
