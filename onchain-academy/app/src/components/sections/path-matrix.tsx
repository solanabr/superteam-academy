"use client";

const FONT_SERIF = "var(--font-instrument-serif), 'Instrument Serif', serif";

const tracks = [
  {
    id: "01",
    name: "RUST",
    tag: "Base Layer",
    color: "#EF4444",
    desc: "Master the low-level, high-performance programming language that powers the Solana virtual machine.",
    modules: "04_ACTIVE",
    difficulty: "HARD",
    difficultyColor: "#EF4444",
    href: "/courses/intro-to-solana",
  },
  {
    id: "02",
    name: "ANCHOR",
    tag: "Framework",
    color: "#9945FF",
    desc: "The sealevel framework of choice. Learn to write secure smart contracts with automated deserialization.",
    modules: "05_ACTIVE",
    difficulty: "MEDIUM",
    difficultyColor: "#a855f7",
    href: "/courses/anchor-development",
  },
  {
    id: "03",
    name: "FRONTEND",
    tag: "Interface",
    color: "#0ea5e9",
    desc: "Build production-ready dApps with React and the Solana Wallet Adapter. Ship real UIs that talk to on-chain programs.",
    modules: "03_ACTIVE",
    difficulty: "BEGINNER",
    difficultyColor: "#0ea5e9",
    href: "/courses/frontend-with-react",
  },
  {
    id: "04",
    name: "DEFI",
    tag: "Protocol",
    color: "#00FFA3",
    desc: "Understand token swaps, liquidity pools, and yield mechanics. Interact with real DeFi protocols on Solana.",
    modules: "03_ACTIVE",
    difficulty: "MEDIUM",
    difficultyColor: "#00FFA3",
    href: "/courses/defi-fundamentals",
  },
  {
    id: "05",
    name: "SECURITY",
    tag: "Auditing",
    color: "#F48252",
    desc: "Learn to identify and prevent common Solana program vulnerabilities. Think like an auditor, build like a fortress.",
    modules: "04_ACTIVE",
    difficulty: "HARD",
    difficultyColor: "#F48252",
    href: "/courses/solana-security",
  },
  {
    id: "06",
    name: "MOBILE",
    tag: "Native",
    color: "#EC4899",
    desc: "Build native Solana mobile dApps with React Native. Tap into the Saga ecosystem and mobile-first Web3.",
    modules: "03_ACTIVE",
    difficulty: "MEDIUM",
    difficultyColor: "#EC4899",
    href: "/courses/mobile-solana-react-native",
  },
];

interface PathMatrixProps {
  locale: string;
}

export function PathMatrix({ locale }: PathMatrixProps) {
  return (
    <section className="py-28 md:py-40 relative border-t border-white/10">
      {/* Header */}
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 mb-12 md:mb-20 flex justify-between items-end">
        <h2
          className="text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-none font-black"
          style={{ mixBlendMode: "difference" }}
        >
          Pick Your <br />
          <span
            className="italic"
            style={{
              fontFamily: FONT_SERIF,
              color: "transparent",
              WebkitTextStroke: "1px rgba(255,255,255,0.4)",
            }}
          >
            Stack_
          </span>
        </h2>
        <div className="text-right hidden md:block">
          <p
            className="text-xs text-white/70 mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            // SELECT PROTOCOL PATH
          </p>
          <div className="flex gap-2 justify-end">
            {["#EF4444", "#9945FF", "#0ea5e9"].map((c) => (
              <div
                key={c}
                className="w-2 h-2 rounded-full"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Track Rows */}
      <div className="border-y border-white/10 w-full">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="path-row group border-b border-white/10 w-full px-6 md:px-12 cursor-pointer"
            style={{ "--path-color": track.color } as React.CSSProperties}
          >
            {/* Tech grid background */}
            <div className="path-tech-bg" />

            {/* Main row content — vertically centered in collapsed state */}
            <div
              className="relative z-10 w-full max-w-screen-2xl mx-auto flex items-center justify-between shrink-0"
              style={{ height: 160 }}
            >
              <h3
                className="path-title"
                style={
                  {
                    "--hover-color": track.color,
                  } as React.CSSProperties
                }
              >
                {track.name}
              </h3>
              <div className="flex flex-col items-end opacity-40 group-hover:opacity-100 transition-opacity duration-200">
                <span
                  className="text-2xl md:text-3xl font-light text-white"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {track.id}
                </span>
                <span
                  className="text-[10px] uppercase tracking-widest mt-1 font-bold"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: track.color,
                  }}
                >
                  {track.tag}
                </span>
              </div>
            </div>

            {/* HUD — hidden by overflow, revealed on row height expansion */}
            <div className="path-hud-wrap relative z-10 px-6 md:px-12">
              <div className="w-full max-w-screen-2xl mx-auto py-8 md:py-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 border-t border-white/10">
                <div>
                  <p className="text-white/70 font-light leading-relaxed max-w-sm text-sm md:text-base">
                    {track.desc}
                  </p>
                </div>
                <div
                  className="flex gap-8 md:gap-12 text-xs"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <div className="flex flex-col gap-2 text-white/70">
                    <span>[MODULES]</span>
                    <span>[DIFFICULTY]</span>
                  </div>
                  <div className="flex flex-col gap-2 text-white">
                    <span>{track.modules}</span>
                    <span style={{ color: track.difficultyColor }}>
                      {track.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex items-start justify-end">
                  <a
                    href={`/${locale}${track.href}`}
                    className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors hover:bg-white hover:text-black"
                    style={{
                      fontFamily: "var(--font-mono)",
                      borderColor: track.color,
                      color: track.color,
                    }}
                  >
                    Enter Path →
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
