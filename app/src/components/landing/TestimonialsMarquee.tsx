"use client";

const TESTIMONIALS = [
  {
    initials: "MA",
    name: "Miguel Andrade",
    role: "Solana Developer",
    quote: "Finally a platform that teaches Solana the right way. The on-chain XP system is genius — every lesson you complete is permanently on-chain.",
    stars: 5,
  },
  {
    initials: "CS",
    name: "Carolina Santos",
    role: "DeFi Engineer",
    quote: "Went from knowing nothing about Rust to deploying an AMM on devnet in 3 weeks. The code challenges are brutally effective.",
    stars: 5,
  },
  {
    initials: "RL",
    name: "Rafael Lima",
    role: "Smart Contract Auditor",
    quote: "The security course alone is worth it. Real exploit patterns with hands-on challenges. This is what Solana education should look like.",
    stars: 5,
  },
  {
    initials: "YK",
    name: "Yuki Nakamura",
    role: "Backend Engineer → Web3",
    quote: "I tried three other Solana courses and gave up. This one clicked immediately. The account model explanation is the clearest I've seen anywhere.",
    stars: 5,
  },
  {
    initials: "EO",
    name: "Emeka Okonkwo",
    role: "Protocol Engineer",
    quote: "Token-2022 course saved me hours of reading docs. Went straight to the important extensions with working code examples.",
    stars: 5,
  },
  {
    initials: "SV",
    name: "Sofia Vasquez",
    role: "Blockchain Developer",
    quote: "The challenge format is addictive. You actually write and run code in every lesson, not just watch someone else. Night and day difference.",
    stars: 5,
  },
  {
    initials: "DK",
    name: "Dmitri Kovalev",
    role: "Rust Developer",
    quote: "As a Rust dev moving into Solana, Anchor was the missing piece. This course bridges that gap perfectly. Production-grade from day one.",
    stars: 5,
  },
  {
    initials: "AM",
    name: "Aisha Mohammed",
    role: "Full-Stack Developer",
    quote: "Earned my first on-chain credential in 48 hours. The soulbound NFT on my wallet feels like a real achievement, not just a PDF certificate.",
    stars: 5,
  },
  {
    initials: "JP",
    name: "João Pedro Silva",
    role: "DeFi Trader → Developer",
    quote: "Built and deployed a real swap program after finishing the AMM course. The x·y=k math finally made sense after those challenges.",
    stars: 5,
  },
  {
    initials: "HZ",
    name: "Hannah Zhang",
    role: "Security Researcher",
    quote: "The missing owner check vulnerability lesson alone could've saved me from a critical bug. Every Solana dev needs to take this security course.",
    stars: 5,
  },
];

const ROW1 = TESTIMONIALS.slice(0, 5);
const ROW2 = TESTIMONIALS.slice(5);

function Card({ initials, name, role, quote, stars }: typeof TESTIMONIALS[0]) {
  return (
    <div className="flex-shrink-0 w-80 bg-card border border-border rounded-lg p-5 flex flex-col gap-3 mx-3">
      <div className="flex gap-0.5">
        {Array.from({ length: stars }).map((_, i) => (
          <span key={i} className="text-[#F5A623] text-sm">★</span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 pt-1 border-t border-border">
        <div className="w-8 h-8 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 flex items-center justify-center font-mono text-xs font-bold text-[#14F195] shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-mono text-xs font-semibold text-foreground">{name}</div>
          <div className="text-[11px] text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  );
}

const SPEED = 60; // seconds for one full cycle (higher = slower)

function MarqueeRow({ items, reverse = false }: { items: typeof TESTIMONIALS; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="flex overflow-hidden">
      <div
        className="flex"
        style={{
          animation: `marquee${reverse ? "-reverse" : ""} ${SPEED}s linear infinite`,
        }}
      >
        {doubled.map((t, i) => (
          <Card key={i} {...t} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsMarquee() {
  return (
    <div className="relative overflow-hidden space-y-4">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

      <MarqueeRow items={ROW1} />
      <MarqueeRow items={ROW2} reverse />

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
