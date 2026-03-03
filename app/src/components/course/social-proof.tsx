import { Card } from "@/components/ui/card";

const stats = [
  { value: "2,400+", label: "Active Students" },
  { value: "57", label: "Lessons Live" },
  { value: "12K+", label: "XP Tokens Minted" },
  { value: "340+", label: "Credentials Earned" },
];

const testimonials = [
  {
    name: "Lucas M.",
    role: "Fullstack Developer",
    text: "Finally a platform that teaches Solana the right way. The interactive challenges are next level.",
  },
  {
    name: "Priya S.",
    role: "Web3 Engineer",
    text: "Went from zero Rust to deploying my first program in two weeks. The on-chain XP is addictive.",
  },
  {
    name: "Carlos R.",
    role: "CS Student",
    text: "The Anchor track broke down concepts I struggled with for months. Now I actually understand PDAs.",
  },
  {
    name: "Sofia K.",
    role: "DeFi Researcher",
    text: "Love that my credentials are on-chain. Already used my NFT certificate in a job interview.",
  },
  {
    name: "James T.",
    role: "Indie Hacker",
    text: "Best free resource for Solana dev. Period. The code editor in the browser is a game-changer.",
  },
  {
    name: "Ana P.",
    role: "Smart Contract Dev",
    text: "The DeFi track taught me more about AMMs than any whitepaper. Practical, hands-on, brilliant.",
  },
  {
    name: "Dev N.",
    role: "Hackathon Winner",
    text: "Used Superteam Academy to prep for Colosseum. Won my first hackathon a month later.",
  },
  {
    name: "Maria L.",
    role: "Backend Engineer",
    text: "The soulbound XP system keeps me coming back every day. Already on a 30-day streak.",
  },
];

function TestimonialCard({
  name,
  role,
  text,
}: {
  name: string;
  role: string;
  text: string;
}) {
  return (
    <Card className="w-[320px] shrink-0 border-border/50 bg-card/80 backdrop-blur-sm p-5 gap-3">
      <p className="text-sm leading-relaxed text-muted-foreground">
        &ldquo;{text}&rdquo;
      </p>
      <div className="mt-auto flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </Card>
  );
}

export function SocialProof() {
  // Duplicate testimonials for seamless infinite scroll
  const row1 = testimonials.slice(0, 4);
  const row2 = testimonials.slice(4);

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-glow-center animate-drift-1" />

      <div className="relative z-10">
        {/* Heading + Stats */}
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Learn together, grow together
            </h2>
            <p className="mt-3 text-muted-foreground">
              Empowering the next generation of Solana builders.
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm px-4 py-5 text-center"
              >
                <div className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                  {stat.value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-20">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
            Loved by students worldwide
          </p>

          {/* Scrolling strip - row 1 (left) */}
          <div className="mt-8 relative">
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-background to-transparent" />

            <div className="flex gap-5 animate-marquee-left">
              {[...row1, ...row1, ...row1, ...row1].map((t, i) => (
                <TestimonialCard key={i} {...t} />
              ))}
            </div>
          </div>

          {/* Scrolling strip - row 2 (right) */}
          <div className="mt-5 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-background to-transparent" />

            <div className="flex gap-5 animate-marquee-right">
              {[...row2, ...row2, ...row2, ...row2].map((t, i) => (
                <TestimonialCard key={i} {...t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
