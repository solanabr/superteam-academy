import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import {
  Anchor,
  ArrowRight,
  Cube,
  CurrencyDollar,
  TerminalWindow,
} from "@phosphor-icons/react/dist/ssr";
import { SuperteamFooter } from "@/components/superteam-footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getAllTracks } from "@/lib/data/queries";

const trackIconMap: Record<string, ComponentType<IconProps>> = {
  Cube,
  Anchor,
  CurrencyDollar,
};

const proofPoints = [
  {
    value: "12.4k+",
    label: "Active builders",
    detail: "Learning and shipping this month.",
  },
  {
    value: "98.1%",
    label: "Verified completion",
    detail: "Milestones tied to signed wallet activity.",
  },
  {
    value: "1.7M",
    label: "Soulbound XP minted",
    detail: "Non-transferable on-chain learning signal.",
  },
];

const learningFlow = [
  {
    icon: Cube,
    title: "Write",
    detail: "Use in-browser lessons and execute real Rust and Anchor code.",
  },
  {
    icon: TerminalWindow,
    title: "Verify",
    detail: "Pass challenge checks and track progress with signed activity.",
  },
  {
    icon: Anchor,
    title: "Prove",
    detail: "Mint soulbound XP and graduate with wallet-native credentials.",
  },
];

export default function Page() {
  const tracks = getAllTracks();
  const totalCourses = tracks.reduce(
    (sum, track) => sum + track.courseCount,
    0
  );

  return (
    <main className="relative min-h-[calc(100dvh-64px)] overflow-x-clip bg-background text-foreground selection:bg-primary/20">
      <section className="relative overflow-hidden border-b border-border/70 bg-background text-foreground">
        <div className="stbr-shape stbr-shape-panel-left" />
        <div className="stbr-shape stbr-shape-band-top" />
        <div className="stbr-shape stbr-shape-orb-bottom-left" />
        <div className="stbr-shape stbr-shape-orb-bottom-right" />
        <div className="stbr-pattern-dashed pointer-events-none absolute inset-0" />
        <div className="stbr-pattern-cross pointer-events-none absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="animate-in slide-in-from-bottom-5 fade-in-0 duration-700 lg:col-span-7 lg:pr-4">
              <h1 className="mt-4 max-w-3xl text-4xl leading-[0.98] font-black tracking-tight sm:text-5xl lg:text-[4.4rem]">
                <span className="font-heading">Learn like a builder.</span>
                <span className="mt-2 block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text font-heading text-transparent">
                  Prove it on-chain.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-[1.12rem]">
                Superteam Academy is built for serious Solana developers. Write
                Rust in the browser, clear challenge suites, and leave with
                proof that compounding teams actually trust.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  asChild
                  className="min-w-[13rem] shadow-[0_10px_28px_-16px_rgba(0,140,76,0.75)]"
                >
                  <Link href="/courses">
                    Enter the curriculum
                    <ArrowRight className="ml-1.5 size-4" weight="bold" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="min-w-[11rem] border-border/80 bg-card/60"
                >
                  <Link href="/leaderboard">See top builders</Link>
                </Button>
              </div>
            </div>

            <div className="animate-in slide-in-from-bottom-8 fade-in-0 duration-1000 lg:col-span-5 lg:pt-1">
              <div className="relative overflow-hidden rounded-3xl border border-border/75 bg-card/90 p-5 shadow-[0_22px_62px_-46px_rgba(27,35,29,0.9)] sm:p-6">
                <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_100%_0%,color-mix(in_srgb,var(--primary)_28%,transparent)_0%,transparent_54%)]" />
                <p className="relative text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                  How it works
                </p>
                <div className="relative mt-4 space-y-3.5">
                  {learningFlow.map(({ icon: Icon, title, detail }, index) => (
                    <article
                      key={title}
                      className="rounded-2xl border border-border/70 bg-background/78 px-4 py-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                          <Icon className="size-4" weight="duotone" />
                        </span>
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                            Step 0{index + 1}
                          </p>
                          <p className="mt-0.5 text-lg leading-tight font-bold">
                            {title}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {detail}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="verification-flow"
        className="relative border-b border-border/70 bg-muted/20"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/60 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-3 md:grid-cols-3">
            {proofPoints.map((point) => (
              <article
                key={point.label}
                className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-[0_14px_30px_-28px_rgba(27,35,29,0.86)] dark:bg-card/65"
              >
                <div className="mb-2 h-1.5 w-12 rounded-full bg-primary/55" />
                <p className="text-2xl font-black tracking-tight">
                  {point.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {point.label}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {point.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4 lg:pr-2">
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                Tracks That Compound
              </p>
              <h2 className="mt-3 max-w-sm font-heading text-3xl font-black tracking-tight md:text-4xl">
                Structured paths, zero fluff.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
                Each track is designed like a shipping system: fundamentals,
                advanced patterns, and production-level challenge work.
              </p>
              <div className="mt-5 rounded-2xl border border-border/70 bg-card/75 px-4 py-3 shadow-[0_14px_32px_-26px_rgba(27,35,29,0.75)]">
                <p className="text-xs text-muted-foreground">Total courses</p>
                <p className="text-2xl font-black">{totalCourses}</p>
              </div>
              <Button
                className="mt-6 w-full max-w-[14rem]"
                variant="outline"
                asChild
              >
                <Link href="/courses">
                  Explore all tracks
                  <ArrowRight className="ml-1.5 size-4" weight="bold" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:col-span-8">
              {tracks.map((track, index) => {
                const Icon = trackIconMap[track.icon] ?? Cube;
                return (
                  <article
                    key={track.id}
                    className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/88 p-5 shadow-[0_14px_28px_-24px_rgba(27,35,29,0.85)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-30px_rgba(27,35,29,0.95)] dark:bg-card/65"
                  >
                    <div className="relative">
                      <div className="flex items-start justify-between">
                        <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                          0{index + 1}
                        </span>
                        <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-primary">
                          <Icon className="size-5" weight="duotone" />
                        </div>
                      </div>
                      <h3 className="mt-4 font-heading text-xl leading-tight font-bold">
                        {track.name}
                      </h3>
                      <p className="mt-2 line-clamp-4 min-h-[4.8rem] text-sm leading-relaxed text-muted-foreground">
                        {track.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {track.courseCount} courses
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          View path
                          <ArrowRight className="size-3.5" weight="bold" />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-border/70 bg-muted/30 text-foreground">
        <div className="pointer-events-none absolute inset-0 opacity-34 [background-image:radial-gradient(circle_at_90%_8%,color-mix(in_srgb,var(--primary)_26%,transparent)_0%,transparent_48%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-22 [background-image:repeating-linear-gradient(-32deg,transparent_0_20px,color-mix(in_srgb,var(--border)_70%,transparent)_20px_21px)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-3xl border border-border/70 bg-card/86 p-6 shadow-[0_24px_90px_-58px_rgba(0,0,0,0.75)] backdrop-blur sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-stretch">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold tracking-[0.16em] text-secondary uppercase">
                  Start Building
                </p>
                <h2 className="mt-3 font-heading text-4xl leading-[1.02] font-black tracking-tight sm:text-5xl lg:text-6xl">
                  From guided lessons to provable builder reputation.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Graduate from toy projects. Ship challenge-validated Solana
                  work, mint wallet-native credentials, and get recognized on a
                  public leaderboard.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    asChild
                    className="h-14 min-w-[240px] px-9 text-base font-semibold"
                  >
                    <Link href="/courses">
                      Start learning now
                      <ArrowRight className="ml-2 size-4.5" weight="bold" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="h-14 min-w-[220px] border-foreground/20 bg-background/60 px-8 text-base font-semibold"
                  >
                    <Link href="/leaderboard">Open leaderboard</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/62 p-4 sm:grid-cols-1">
                <article className="rounded-xl border border-border/70 bg-card/78 p-3">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Why teams trust this
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    No toy exercises. Learners complete challenge-validated work
                    and graduate with wallet-native credentials.
                  </p>
                </article>
                <article className="rounded-xl border border-border/70 bg-card/78 p-3">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Built for outcomes
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Structured tracks, production patterns, and visible proof of
                    progress on-chain.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SuperteamFooter />
    </main>
  );
}
