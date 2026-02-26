"use client";

import { cn } from "@/lib/utils/cn";

const techStack = [
  { name: "Solana", icon: "◎", color: "#9945FF" },
  { name: "Rust", icon: "🦀", color: "#FF6B35" },
  { name: "Anchor", icon: "⚓", color: "#14F195" },
  { name: "TypeScript", icon: "TS", color: "#3178C6" },
  { name: "Token-2022", icon: "⚡", color: "#14F195" },
  { name: "Metaplex", icon: "🎨", color: "#9945FF" },
  { name: "React", icon: "⚛", color: "#61DAFB" },
  { name: "Next.js", icon: "▲", color: "#FFFFFF" },
  { name: "Monaco Editor", icon: "</>", color: "#007ACC" },
  { name: "Helius RPC", icon: "⚡", color: "#FF6B35" },
  { name: "Phantom", icon: "👻", color: "#AB9FF2" },
  { name: "Solflare", icon: "☀️", color: "#FC7A17" },
  { name: "DAS API", icon: "🔗", color: "#00C2FF" },
  { name: "Zustand", icon: "🐻", color: "#FFB344" },
  { name: "Framer Motion", icon: "✦", color: "#BB4DE8" },
  { name: "Tailwind CSS", icon: "🌊", color: "#06B6D4" },
];

const achievements = [
  { emoji: "🏆", text: "1,247 enrolled in Solana Fundamentals" },
  { emoji: "⚡", text: "2.1M XP awarded on-chain" },
  { emoji: "🎓", text: "890 NFT credentials minted" },
  { emoji: "🔥", text: "87-day longest streak" },
  { emoji: "🌍", text: "28 countries represented" },
  { emoji: "💻", text: "12,000+ code challenges completed" },
  { emoji: "⚓", text: "432 DeFi protocols deployed" },
  { emoji: "🚀", text: "Open source — fork and extend" },
];

function TechItem({ tech }: { tech: typeof techStack[0] }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] whitespace-nowrap group hover:border-white/15 hover:bg-white/[0.05] transition-all duration-200 cursor-default">
      <span className="text-sm" style={{ color: tech.color }}>
        {tech.icon}
      </span>
      <span className="text-sm font-medium text-foreground/70 group-hover:text-foreground/90 transition-colors">
        {tech.name}
      </span>
    </div>
  );
}

function AchievementItem({ item }: { item: typeof achievements[0] }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 whitespace-nowrap">
      <span className="text-base">{item.emoji}</span>
      <span className="text-sm text-muted-foreground">{item.text}</span>
      <span className="w-1 h-1 rounded-full bg-white/20 mx-1" />
    </div>
  );
}

export function TechMarquee() {
  const doubled = [...techStack, ...techStack];
  const doubledAch = [...achievements, ...achievements];

  return (
    <section className="py-12 overflow-hidden relative">
      <div className="section-divider mb-10" />

      {/* Row 1 — tech stack */}
      <div className="marquee-container mb-3">
        <div className="marquee-track gap-3 px-3">
          {doubled.map((tech, i) => (
            <TechItem key={`${tech.name}-${i}`} tech={tech} />
          ))}
        </div>
      </div>

      {/* Row 2 — achievements reverse */}
      <div className="marquee-container">
        <div className="marquee-track marquee-track-reverse gap-0">
          {doubledAch.map((item, i) => (
            <AchievementItem key={i} item={item} />
          ))}
        </div>
      </div>

      <div className="section-divider mt-10" />
    </section>
  );
}
