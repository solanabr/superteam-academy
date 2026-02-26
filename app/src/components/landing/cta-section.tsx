"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Github, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="section-divider mb-20" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Main CTA card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF]/20 via-[#0a0a1a] to-[#14F195]/15" />
          <div className="absolute inset-0 bg-grid opacity-20" />

          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#9945FF]/20 blur-[80px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[150px] bg-[#14F195]/15 blur-[60px] rounded-full" />

          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#9945FF]/40 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#14F195]/40 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#14F195]/40 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#9945FF]/40 rounded-br-lg" />

          <div className="relative z-10 text-center py-16 px-8">
            {/* Icon */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center shadow-glow-purple"
            >
              <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Ready to build on{" "}
              <span className="gradient-text">Solana?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
              Join 5,000+ developers learning Solana. Start free — your first
              on-chain credential is waiting.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Button asChild variant="gradient" size="xl" className="group">
                <Link href="/courses">
                  Start Learning Now
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl" className="group">
                <a
                  href="https://github.com/solanabr/superteam-academy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground/50 flex items-center justify-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#14F195]" />
                Free forever
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#9945FF]" />
                Open source
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#00C2FF]" />
                No credit card required
              </span>
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
