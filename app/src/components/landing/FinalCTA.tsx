
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export function FinalCTA() {
  return (
    <section className="py-32 bg-[#0A0A0F] relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-[#9945FF]/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
           className="max-w-3xl mx-auto p-12 rounded-[3rem] bg-gradient-to-b from-[#1E1E24] to-[#0A0A0F] border border-[#2E2E36] overflow-hidden relative shadow-2xl"
        >
          {/* Subtle Grid in background of CTA */}
          <div className="absolute inset-0 bg-grid-pattern-light opacity-50" />

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 relative z-10">
            Start Your <span className="text-gradient-solana">Solana Journey</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 relative z-10">
            Join thousands of developers learning to build the future of decentralized applications on Solana.
          </p>
          
          <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-gray-200 px-12 h-14 text-lg font-bold relative z-10 transition-transform hover:scale-105 active:scale-95">
            <Link href="/courses">Get Started Free</Link>
          </Button>

          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#14F195]/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#9945FF]/20 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}
