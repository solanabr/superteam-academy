
"use client";

import { motion } from "framer-motion";
import { Terminal, Coins, Quote, Brain, Globe, Trophy, Award } from "lucide-react";

const features = [
  {
    icon: <Terminal className="h-6 w-6 text-[#14F195]" />,
    title: "Real Code Execution",
    description: "Write and run Solana TypeScript code directly in your browser with instant feedback.",
    color: "green",
  },
  {
    icon: <Coins className="h-6 w-6 text-[#9945FF]" />,
    title: "On-Chain XP Tokens",
    description: "Earn soulbound SPL tokens as you progress. Your achievements are permanent and on-chain.",
    color: "purple",
  },
  {
    icon: <Award className="h-6 w-6 text-[#14F195]" />,
    title: "cNFT Credentials",
    description: "Receive compressed NFTs upon course completion. A verified proof of your mastery.",
    color: "green",
  },
  {
    icon: <Brain className="h-6 w-6 text-[#9945FF]" />,
    title: "AI Code Review",
    description: "Get instant feedback and hints from an AI tutor trained on Solana development patterns.",
    color: "purple",
  },
  {
    icon: <Globe className="h-6 w-6 text-[#14F195]" />,
    title: "Multi-Language Support",
    description: "Learn in English, Portuguese, or Spanish. Community-driven translations.",
    color: "green",
  },
  {
    icon: <Trophy className="h-6 w-6 text-[#9945FF]" />,
    title: "Gamified Learning",
    description: "Level up, build streaks, and climb the leaderboard as you compete with developers globally.",
    color: "purple",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-24 bg-[#0A0A0F] relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to go from zero to a professional Solana engineer in one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="group p-8 rounded-2xl bg-[#1E1E24]/50 border border-[#2E2E36] transition-all hover:border-[#9945FF]/50 relative overflow-hidden"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF]/0 to-[#9945FF]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="mb-4 inline-flex items-center justify-center p-3 rounded-xl bg-[#0A0A0F] border border-[#2E2E36] group-hover:border-[#9945FF]/30 group-hover:glow-purple transition-all">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
