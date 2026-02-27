
"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Courses", value: "3" },
  { label: "Lessons", value: "12+" },
  { label: "Devnet XP", value: "Real" },
  { label: "Credentials", value: "cNFT" },
  { label: "AI Support", value: "24/7" },
];

export function StatsBar() {
  return (
    <div className="w-full border-y border-[#2E2E36] bg-[#0A0A0F]/50 backdrop-blur-sm relative z-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-[#14F195] glow-green mb-1">
                {stat.value}
              </div>
              <div className="text-xs uppercase tracking-widest text-gray-500 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
