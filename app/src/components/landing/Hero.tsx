
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("HomePage");

  return (
    <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0A0A0F] pt-20">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern-light pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0F]/50 to-[#0A0A0F] pointer-events-none" />

      {/* Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#9945FF]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative z-10 px-4 mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
           initial={{ opacity: 0, x: -50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="text-left"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9945FF]/10 border border-[#9945FF]/20 text-[#9945FF] text-xs font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
            Now Powered by AI & Solana Devnet
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="text-white block">Learn</span>
            <span className="text-gradient-solana">Solana Development</span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-xl leading-relaxed">
            Master Solana development with hands-on courses, real on-chain credentials, 
            and AI-powered assistance. Build the future of Web3 today.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full bg-[#9945FF] hover:bg-[#7b35cc] text-white px-8 h-12 shadow-[0_0_20px_rgba(153,69,255,0.3)] border-0">
              <Link href="/courses">Start Learning</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-[#2E2E36] bg-transparent text-white hover:bg-[#1E1E24] px-8 h-12">
              <Link href="/courses">View Catalog</Link>
            </Button>
          </div>
        </motion.div>

        {/* Right Content - Animated Code Snippet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="hidden lg:block relative"
        >
          <div className="w-full h-[450px] bg-[#1E1E24]/80 backdrop-blur-xl rounded-2xl border border-[#2E2E36] p-6 shadow-2xl overflow-hidden font-mono text-sm">
            <div className="flex gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-500"
              >
                // Create a new Solana transaction
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 1.5 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-[#9945FF]">const</span> <span className="text-[#14F195]">transaction</span> = <span className="text-white">new</span> <span className="text-[#14F195]">Transaction</span>();
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="text-gray-500"
              >
                // Add your instruction
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 3, duration: 1.5 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-[#14F195]">transaction</span>.<span className="text-[#FFBD2E]">add</span>(
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 4.5, duration: 1.5 }}
                className="pl-4 overflow-hidden whitespace-nowrap"
              >
                <span className="text-[#14F195]">SystemProgram</span>.<span className="text-[#FFBD2E]">transfer</span>(&#123;
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 6, duration: 1 }}
                className="pl-8 overflow-hidden whitespace-nowrap"
              >
                <span className="text-gray-400">fromPubkey:</span> <span className="text-white">wallet.publicKey</span>,
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 7, duration: 1 }}
                className="pl-8 overflow-hidden whitespace-nowrap"
              >
                <span className="text-gray-400">toPubkey:</span> <span className="text-white">receiverPubkey</span>,
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 8, duration: 1 }}
                className="pl-8 overflow-hidden whitespace-nowrap"
              >
                <span className="text-gray-400">lamports:</span> <span className="text-[#14F195]">1000 * LAMPORTS_PER_SOL</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 9.5 }}
              >
                <span className="text-white">  &#125;));</span>
              </motion.div>
            </div>

            {/* Floating XP Tag */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-6 right-6 bg-[#14F195]/20 border border-[#14F195]/30 text-[#14F195] px-4 py-2 rounded-xl text-lg font-bold glow-green"
            >
              +500 XP
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
