// app/src/components/landing/hero-section.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="container px-4 md:px-6 relative z-10 text-center">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            Live on Solana Devnet
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent pb-2">
            Build the Future of Web3 <br/> on Solana
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The ultimate interactive learning platform for developers. 
            Learn Rust, Anchor, and DeFi by building real dApps. Earn on-chain XP and verifiable credentials.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/courses">
                <Button size="lg" className="w-full sm:w-auto h-12 text-lg px-8 gap-2">
                    Start Learning <ArrowRight className="h-5 w-5" />
                </Button>
            </Link>
            <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 text-lg px-8">
                    Explore Features
                </Button>
            </Link>
          </div>
        </motion.div>

        {/* Code Snippet Visual */}
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 mx-auto max-w-4xl rounded-xl border bg-card/50 backdrop-blur shadow-2xl overflow-hidden"
        >
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-muted-foreground font-mono ml-2">lib.rs</span>
            </div>
            <div className="p-6 text-left font-mono text-sm overflow-x-auto text-blue-100">
                <pre>
{`#[program]
pub mod superteam_academy {
    use super::*;

    pub fn complete_lesson(ctx: Context<CompleteLesson>, lesson_id: u8) -> Result<()> {
        let learner = &mut ctx.accounts.learner;
        // Mint XP to learner
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo { ... },
                signer_seeds
            ),
            50 // +50 XP
        )?;
        Ok(())
    }
}`}
                </pre>
            </div>
        </motion.div>
      </div>
    </section>
  );
}