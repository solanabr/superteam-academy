import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllCourses } from "@/lib/sanity";
import type { Metadata } from "next";
import { TestimonialsMarquee } from "@/components/landing/TestimonialsMarquee";

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
  const courses = await getAllCourses().catch(() => []);

  const stats = [
    { label: "500+", sublabel: t("hero.stats.developers") },
    { label: `${Math.max(courses.length, 10)}+`, sublabel: t("hero.stats.courses") },
    { label: "∞", sublabel: t("hero.stats.xpMinted") },
  ];

  const features = [
    { key: "onChain" as const, color: "#14F195" },
    { key: "credentials" as const, color: "#9945FF" },
    { key: "editor" as const, color: "#00D4FF" },
    { key: "rewards" as const, color: "#F5A623" },
  ];

  return (
    <div className="bg-background text-foreground">
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
          {/* H1 */}
          <h1 className="font-mono font-black text-5xl sm:text-7xl md:text-8xl leading-[0.9] tracking-tight mb-6">
            <span className="block text-white">Master</span>
            <span className="block text-white">Solana</span>
            <span className="block text-[#14F195]">Development</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10 font-mono">
            {t("hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-accent-dim transition-colors"
            >
              <span>◎</span>
              {t("hero.cta")}
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 border border-border text-foreground font-mono text-sm px-6 py-2.5 rounded-full hover:bg-card hover:border-border-hover transition-colors"
            >
              Find your starting point →
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16">
            {stats.map(({ label, sublabel }) => (
              <div key={sublabel} className="text-center">
                <div className="font-mono text-2xl font-bold text-foreground mono-numbers">
                  {label}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wider">
                  {sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ── Learning Tracks + Features (unified) ── */}
      <section id="tracks" className="py-20 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-mono font-black text-3xl sm:text-4xl text-white mb-3">
              {t("tracks.title")}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("tracks.subtitle")}
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Row 1: wide + narrow */}
            <Link
              href={{ pathname: "/courses", query: { track: "1" } }}
              className="md:col-span-2 group relative bg-card border border-border rounded-2xl p-8 hover:border-[#14F195]/30 transition-all overflow-hidden flex flex-col justify-between min-h-[220px]"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "radial-gradient(ellipse at bottom left, rgba(20,241,149,0.04) 0%, transparent 60%)" }}
              />
              <div className="relative">
                <p className="font-mono font-black text-4xl text-foreground uppercase tracking-tight mb-3">
                  Solana Basics
                </p>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Core concepts: accounts, transactions, PDAs, and the programming model from scratch.
                </p>
              </div>
              <div className="relative mt-6">
                <span className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-5 py-2 rounded-full group-hover:bg-accent-dim transition-colors">
                  Explore Track →
                </span>
              </div>
            </Link>

            <Link
              href={{ pathname: "/courses", query: { track: "2" } }}
              className="group relative bg-card border border-border rounded-2xl p-8 hover:border-[#9945FF]/30 transition-all overflow-hidden flex flex-col justify-between min-h-[220px]"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "radial-gradient(ellipse at top right, rgba(153,69,255,0.06) 0%, transparent 60%)" }}
              />
              <div className="relative">
                <p className="font-mono font-black text-5xl text-foreground mb-1">3+</p>
                <p className="text-xs text-muted-foreground font-mono mb-4">Courses</p>
                <span
                  className="inline-block font-mono text-xs font-semibold px-3 py-1 rounded-full border"
                  style={{ color: "#9945FF", borderColor: "#9945FF40", backgroundColor: "#9945FF10" }}
                >
                  Anchor Framework
                </span>
              </div>
              <p className="relative text-xs text-muted-foreground leading-relaxed mt-4">
                Build on-chain programs with Anchor — PDAs, CPIs, constraints, error handling.
              </p>
            </Link>

            {/* Row 2: narrow + wide */}
            <Link
              href={{ pathname: "/courses", query: { track: "3" } }}
              className="group relative bg-card border border-border rounded-2xl p-8 hover:border-[#00D4FF]/30 transition-all overflow-hidden flex flex-col justify-between min-h-[220px]"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "radial-gradient(ellipse at bottom right, rgba(0,212,255,0.05) 0%, transparent 60%)" }}
              />
              <div className="relative">
                <p className="font-mono font-black text-5xl text-foreground mb-1">2+</p>
                <p className="text-xs text-muted-foreground font-mono mb-4">Courses</p>
                <span
                  className="inline-block font-mono text-xs font-semibold px-3 py-1 rounded-full border"
                  style={{ color: "#00D4FF", borderColor: "#00D4FF40", backgroundColor: "#00D4FF10" }}
                >
                  DeFi & AMMs
                </span>
              </div>
              <p className="relative text-xs text-muted-foreground leading-relaxed mt-4">
                Liquidity pools, constant-product AMMs, swap mechanics, and protocol design.
              </p>
            </Link>

            <Link
              href={{ pathname: "/courses", query: { track: "4" } }}
              className="md:col-span-2 group relative bg-card border border-border rounded-2xl p-8 hover:border-[#F5A623]/30 transition-all overflow-hidden flex flex-col justify-between min-h-[220px]"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "radial-gradient(ellipse at bottom right, rgba(245,166,35,0.04) 0%, transparent 60%)" }}
              />
              <div className="relative">
                <p className="font-mono font-black text-4xl text-foreground uppercase tracking-tight mb-3">
                  NFTs & Digital Assets
                </p>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Metaplex Core, Token-2022 extensions, soulbound credentials, and on-chain metadata.
                </p>
              </div>
              <div className="relative mt-6">
                <span className="inline-flex items-center gap-2 bg-[#F5A623] text-black font-mono font-semibold text-sm px-5 py-2 rounded-full group-hover:opacity-80 transition-opacity">
                  Explore Track →
                </span>
              </div>
            </Link>

            {/* Row 3: full width */}
            <Link
              href={{ pathname: "/courses", query: { track: "5" } }}
              className="md:col-span-3 group relative bg-card border border-border rounded-2xl p-8 hover:border-[#FF4444]/30 transition-all overflow-hidden min-h-[160px]"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "radial-gradient(ellipse at center left, rgba(255,68,68,0.04) 0%, transparent 50%)" }}
              />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="font-mono font-black text-4xl text-foreground uppercase tracking-tight mb-3">
                    Full-Stack Solana
                  </p>
                  <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                    End-to-end dApp development — program architecture, client SDKs, wallet integration, and production deployment.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-2 bg-[#FF4444] text-white font-mono font-semibold text-sm px-5 py-2 rounded-full group-hover:opacity-80 transition-opacity">
                    Explore Track →
                  </span>
                </div>
              </div>
            </Link>

          </div>

          {/* Features — no divider, unified with tracks */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {features.map(({ key, color }) => (
              <div
                key={key}
                className="group relative bg-card border border-border rounded-2xl p-6 overflow-hidden transition-all"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(ellipse at top left, ${color}08 0%, transparent 60%)` }}
                />
                <div className="relative">
                  <div
                    className="w-1.5 h-6 rounded-full mb-4"
                    style={{ backgroundColor: color }}
                  />
                  <h3 className="font-mono font-bold text-lg text-white mb-2 leading-tight">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(`features.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 border-t border-border overflow-hidden">
        <div className="text-center mb-12 px-4">
          <h2 className="font-mono text-2xl font-bold text-foreground">
            {t("socialProof.testimonials")}
          </h2>
        </div>
        <TestimonialsMarquee />
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card border border-[#14F195]/20 rounded-lg p-10">
            <h2 className="font-mono text-2xl font-bold text-foreground mb-3">
              {t("socialProof.title")}
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              Join hundreds of developers building on Solana. Earn on-chain credentials. Ship real programs.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-8 py-3 rounded-full hover:bg-accent-dim transition-colors"
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
