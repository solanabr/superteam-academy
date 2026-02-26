"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Superteam Academy changed my career. In 3 months I went from a JavaScript dev to building production Anchor programs. The XP system kept me hooked every single day.",
    name: "Diego Fernández",
    role: "Solana Developer",
    company: "@ Marinade Finance",
    xp: "24,500 XP",
    level: 15,
    avatar: "DF",
    color: "#9945FF",
    stars: 5,
  },
  {
    quote: "The best thing about this platform is the on-chain credentials. My NFT badge proved my skills to my first Web3 employer without a single traditional interview.",
    name: "Mariana Costa",
    role: "DeFi Engineer",
    company: "@ Solend",
    xp: "31,200 XP",
    level: 17,
    avatar: "MC",
    color: "#14F195",
    stars: 5,
  },
  {
    quote: "Portuguese content made all the difference. I finally understood PDAs, CPIs, and the Anchor framework without fighting language barriers the entire time.",
    name: "Carlos Ramírez",
    role: "Blockchain Developer",
    company: "@ Freelance",
    xp: "18,700 XP",
    level: 13,
    avatar: "CR",
    color: "#00C2FF",
    stars: 5,
  },
  {
    quote: "The code challenges are brilliant. I built a real AMM as part of the DeFi course — that exact project is now in my portfolio and got me hired at my dream company.",
    name: "Ana Luiza Santos",
    role: "Smart Contract Auditor",
    company: "@ Certik",
    xp: "42,100 XP",
    level: 20,
    avatar: "AL",
    color: "#FF6B35",
    stars: 5,
  },
  {
    quote: "The streak system is dangerously effective. 87 days and counting. I've shipped more Solana code this year than in the previous three years combined.",
    name: "Rodrigo Alves",
    role: "Protocol Engineer",
    company: "@ Jupiter",
    xp: "48,750 XP",
    level: 22,
    avatar: "RA",
    color: "#FFD700",
    stars: 5,
  },
  {
    quote: "From zero web3 knowledge to deploying a Token-2022 program in 6 weeks. The pace is perfect and the Discord community is incredibly supportive and active.",
    name: "Isabella Morales",
    role: "Full Stack Solana Dev",
    company: "@ Superteam MX",
    xp: "15,400 XP",
    level: 12,
    avatar: "IM",
    color: "#AB9FF2",
    stars: 5,
  },
];

function TestimonialCard({
  t,
  index,
  isInView,
}: {
  t: typeof testimonials[0];
  index: number;
  isInView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="gradient-border-card card-shine p-5 flex flex-col gap-4 h-full"
    >
      {/* Quote icon + stars */}
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${t.color}15` }}
        >
          <Quote className="w-4 h-4" style={{ color: t.color }} />
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: t.stars }).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </div>

      {/* Quote */}
      <p className="text-sm text-foreground/80 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>

      {/* Author */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}
          >
            {t.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.role} <span style={{ color: t.color }}>{t.company}</span></p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="xp-pill">{t.xp}</div>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Level {t.level}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.12]" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">
            Developer Stories
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Builders who leveled up with{" "}
            <span className="gradient-text">Academy</span>
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">4.9/5</span> — 1,240+ reviews
            </p>
          </div>
        </motion.div>

        {/* 3-column masonry-style grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
