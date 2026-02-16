"use client"

import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { ArrowRight, Play, Code2, Shield, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWalletAuth } from "@/components/providers/wallet-auth-provider"

export function HeroSection() {
  const { connected } = useWallet()
  const { setVisible } = useWalletModal()
  const { isAuthenticated, isLoading, loginWithWallet } = useWalletAuth()

  const handleUnlockClick = () => {
    if (!connected) {
      setVisible(true)
      return
    }
    void loginWithWallet().catch(() => undefined)
  }

  return (
    <section className="relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-6 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 border-primary/30 bg-primary/10 text-primary px-4 py-1.5"
          >
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Now with Solana 2.0 Support
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Learn Blockchain Development by{" "}
            <span className="text-primary">Building</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto text-pretty">
            Master Solana, Rust, and Web3 through interactive coding challenges.
            Earn XP, collect on-chain credentials, and join a global community of
            blockchain developers.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <>
                <Link href="/courses">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-12 text-base glow-green"
                  >
                    Start Learning
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-border text-foreground hover:bg-secondary h-12 text-base"
                  >
                    <Play className="h-4 w-4" />
                    Open Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-12 text-base glow-green"
                  disabled={isLoading}
                  onClick={handleUnlockClick}
                >
                  {isLoading ? "Authorizing..." : "Connect Wallet to Start"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-border text-foreground hover:bg-secondary h-12 text-base"
                  >
                    <Play className="h-4 w-4" />
                    Explore Features
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Floating skill tags */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "Solana", icon: Coins },
              { label: "Rust", icon: Code2 },
              { label: "DeFi", icon: Coins },
              { label: "Security", icon: Shield },
              { label: "Anchor", icon: Code2 },
              { label: "NFTs", icon: Coins },
            ].map((tag) => (
              <div
                key={tag.label}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground"
              >
                <tag.icon className="h-3.5 w-3.5 text-primary" />
                {tag.label}
              </div>
            ))}
          </div>
        </div>

        {/* Code preview mock */}
        <div className="mx-auto mt-16 max-w-2xl rounded-xl border border-border bg-card overflow-hidden glow-green">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-destructive/60" />
            <div className="h-3 w-3 rounded-full bg-[hsl(var(--gold))]/60" />
            <div className="h-3 w-3 rounded-full bg-primary/60" />
            <span className="ml-2 text-xs text-muted-foreground font-mono">counter.rs</span>
          </div>
          <div className="p-6 font-mono text-sm leading-relaxed">
            <div className="text-muted-foreground">
              <span className="text-primary">use</span>{" "}
              <span className="text-foreground">anchor_lang::prelude::*</span>;
            </div>
            <div className="mt-2 text-muted-foreground">
              <span className="text-[hsl(var(--gold))]">#[program]</span>
            </div>
            <div className="text-muted-foreground">
              <span className="text-primary">pub mod</span>{" "}
              <span className="text-foreground">counter</span> {"{"}
            </div>
            <div className="pl-4 text-muted-foreground">
              <span className="text-primary">pub fn</span>{" "}
              <span className="text-[hsl(var(--gold))]">initialize</span>
              {"(ctx: Context<Initialize>) -> Result<()> {"}
            </div>
            <div className="pl-8 text-muted-foreground">
              {"ctx.accounts.counter.count = "}
              <span className="text-primary">0</span>;
            </div>
            <div className="pl-8 text-muted-foreground">
              {"Ok(())"}
            </div>
            <div className="pl-4 text-muted-foreground">{"}"}</div>
            <div className="text-muted-foreground">{"}"}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
