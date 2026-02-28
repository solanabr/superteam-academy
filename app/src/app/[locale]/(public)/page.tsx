import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllCourses } from "@/lib/sanity";
import { TRACKS } from "@/types";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.hero" });
  return { title: "Superteam Academy", description: t("subtitle") };
}

export default async function LandingPage() {
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const courses = await getAllCourses().catch(() => []);

  const stats = [
    { label: "500+", sublabel: t("hero.stats.developers") },
    { label: `${Math.max(courses.length, 10)}+`, sublabel: t("hero.stats.courses") },
    { label: "∞", sublabel: t("hero.stats.xpMinted") },
  ];

  const features = [
    {
      icon: "◎",
      key: "onChain" as const,
      color: "#14F195",
    },
    {
      icon: "🔒",
      key: "credentials" as const,
      color: "#9945FF",
    },
    {
      icon: "⚡",
      key: "editor" as const,
      color: "#00D4FF",
    },
    {
      icon: "🏆",
      key: "rewards" as const,
      color: "#F5A623",
    },
  ];

  return (
    <div className="bg-[#0A0A0A] text-[#EDEDED]">
      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center grid-pattern overflow-hidden px-4">
        {/* Background glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(20,241,149,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#14F195]/10 border border-[#14F195]/20 rounded-full px-4 py-1.5 mb-8 font-mono text-xs text-[#14F195]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
            {t("hero.badge")}
          </div>

          {/* H1 */}
          <h1 className="font-mono font-black text-5xl sm:text-7xl md:text-8xl leading-[0.9] tracking-tight mb-6">
            <span className="block text-[#EDEDED]">Master</span>
            <span className="block text-[#EDEDED]">Solana</span>
            <span className="block text-[#14F195]">Development</span>
          </h1>

          <p className="text-[#666666] text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10 font-mono">
            {t("hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#0D9E61] transition-colors"
            >
              <span>◎</span>
              {t("hero.cta")}
            </Link>
            <a
              href="#tracks"
              className="inline-flex items-center gap-2 border border-[#1F1F1F] text-[#EDEDED] font-mono text-sm px-6 py-2.5 rounded hover:bg-[#111111] hover:border-[#2E2E2E] transition-colors"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>

          <div className="mt-4">
            <a
              href="./onboarding"
              className="text-xs font-mono text-[#666666] hover:text-[#14F195] underline underline-offset-4 transition-colors"
            >
              Not sure where to start? Take the skill assessment →
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16">
            {stats.map(({ label, sublabel }) => (
              <div key={sublabel} className="text-center">
                <div className="font-mono text-2xl font-bold text-[#EDEDED] mono-numbers">
                  {label}
                </div>
                <div className="text-[10px] text-[#666666] font-mono mt-0.5 uppercase tracking-wider">
                  {sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal decoration */}
        <div className="absolute bottom-8 right-8 hidden lg:block font-mono text-[10px] text-[#333333] text-right">
          <div className="text-[#14F195]">$ solana balance</div>
          <div>42,000 XP tokens</div>
          <div className="text-[#14F195]">$ academy level</div>
          <div>Level 20 · Master Builder</div>
        </div>
      </section>

      {/* ── Learning Tracks ── */}
      <section id="tracks" className="py-20 px-4 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-mono text-2xl font-bold text-[#EDEDED] mb-2">
              {t("tracks.title")}
            </h2>
            <p className="text-sm text-[#666666] max-w-md mx-auto">
              {t("tracks.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {Object.values(TRACKS).map((track) => (
              <Link
                key={track.id}
                href={{ pathname: "/courses", query: { track: String(track.id) } }}
                className="group bg-[#111111] border border-[#1F1F1F] rounded p-4 hover:border-[#2E2E2E] transition-all"
              >
                <div
                  className="text-2xl mb-3 transition-transform group-hover:scale-110"
                >
                  {track.icon}
                </div>
                <h3
                  className="font-mono text-sm font-semibold mb-1"
                  style={{ color: track.color }}
                >
                  {track.name}
                </h3>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  {track.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-mono text-2xl font-bold text-[#EDEDED]">
              {t("features.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon, key, color }) => (
              <div
                key={key}
                className="bg-[#111111] border border-[#1F1F1F] rounded p-5 hover:border-[#2E2E2E] transition-all"
              >
                <div
                  className="text-2xl mb-4 w-10 h-10 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${color}15` }}
                >
                  {icon}
                </div>
                <h3 className="font-mono text-sm font-semibold text-[#EDEDED] mb-2">
                  {t(`features.${key}.title`)}
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  {t(`features.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-4 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-mono text-2xl font-bold text-[#EDEDED]">
              {t("socialProof.testimonials")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                initials: "MA",
                name: "Miguel Andrade",
                role: "Solana Developer",
                quote:
                  "Finally a platform that teaches Solana the right way. The on-chain XP system is genius — every lesson you complete is permanently on-chain.",
              },
              {
                initials: "CS",
                name: "Carolina Santos",
                role: "DeFi Engineer",
                quote:
                  "Went from knowing nothing about Rust to deploying an AMM on devnet in 3 weeks. The code challenges are brutally effective.",
              },
              {
                initials: "RL",
                name: "Rafael Lima",
                role: "Smart Contract Auditor",
                quote:
                  "The security course alone is worth it. Real exploit patterns with hands-on challenges. This is what Solana education should look like.",
              },
            ].map(({ initials, name, role, quote }) => (
              <div
                key={name}
                className="bg-[#111111] border border-[#1F1F1F] rounded p-5 flex flex-col gap-4"
              >
                <p className="text-sm text-[#666666] leading-relaxed flex-1">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center font-mono text-xs font-bold text-[#EDEDED] shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="font-mono text-sm font-semibold text-[#EDEDED]">
                      {name}
                    </div>
                    <div className="text-xs text-[#666666]">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-4 border-t border-[#1F1F1F]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-[#111111] border border-[#14F195]/20 rounded-lg p-10">
            <h2 className="font-mono text-2xl font-bold text-[#EDEDED] mb-3">
              {t("socialProof.title")}
            </h2>
            <p className="text-sm text-[#666666] mb-8 max-w-sm mx-auto">
              Join hundreds of developers building on Solana. Earn on-chain credentials. Ship real programs.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-8 py-3 rounded hover:bg-[#0D9E61] transition-colors"
            >
              <span>◎</span>
              {t("hero.cta")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
