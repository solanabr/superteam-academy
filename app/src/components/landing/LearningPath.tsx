
"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Code, ShieldCheck } from "lucide-react";

const steps = [
  {
    level: "Beginner",
    title: "Solana Fundamentals",
    description: "Learn about the architecture, accounts, and build your first token.",
    icon: <Zap className="h-6 w-6 text-yellow-400" />,
  },
  {
    level: "Intermediate",
    title: "Program Development",
    description: "Deep dive into Anchor, PDAs, and cross-program invocations.",
    icon: <Code className="h-6 w-6 text-blue-400" />,
  },
  {
    level: "Advanced",
    title: "DeFi & Production",
    description: "Build a DEX, implement security audits, and deploy to Mainnet.",
    icon: <ShieldCheck className="h-6 w-6 text-[#14F195]" />,
  },
];

export function LearningPath() {
  return (
    <section className="py-24 bg-[#0A0A0F] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#14F195]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Your Journey</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A structured path to take you from a curious developer to a professional Solana engineer.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4 relative px-4 text-left">
          {steps.map((step, index) => (
            <div key={index} className="flex-1 flex items-center w-full lg:w-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                className="w-full relative p-8 rounded-3xl bg-[#1E1E24]/30 border border-[#2E2E36] backdrop-blur-sm group hover:border-[#14F195]/30 transition-all"
              >
                <div className="text-xs font-bold uppercase tracking-widest text-[#14F195] mb-4">
                  {step.level}
                </div>
                <div className="mb-4">{step.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm mb-6">
                  {step.description}
                </p>
                <div className="h-1 w-full bg-[#2E2E36] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 1 }}
                    className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195]"
                  />
                </div>
              </motion.div>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:flex items-center justify-center w-12 text-[#2E2E36]">
                  <ArrowRight className="h-8 w-8" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
