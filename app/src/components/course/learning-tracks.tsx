import Link from "next/link";
import { ArrowRight, Flame, Anchor, Blocks, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const tracks = [
  {
    name: "Solana Fundamentals",
    category: "CORE",
    lessons: 24,
    completed: 0,
    tag: "Beginner",
    description: "Accounts, transactions, PDAs, and the runtime model.",
    accent: "#34d399",
    icon: Blocks,
    preview: [
      "let account = ctx.accounts.data;",
      "account.authority = *ctx.accounts",
      "  .signer.key;",
      'msg!("PDA initialized");',
    ],
  },
  {
    name: "Anchor Development",
    category: "FRAMEWORK",
    lessons: 18,
    completed: 0,
    tag: "Intermediate",
    description: "Build and deploy programs with the Anchor framework.",
    accent: "#eab308",
    icon: Anchor,
    preview: [
      "#[program]",
      "pub mod counter {",
      "  pub fn increment(ctx: Ctx)",
      "    -> Result<()> { .. }",
    ],
  },
  {
    name: "DeFi Protocols",
    category: "DEFI",
    lessons: 15,
    completed: 0,
    tag: "Advanced",
    description: "AMMs, lending protocols, and composable DeFi.",
    accent: "#22d3ee",
    icon: Landmark,
    preview: [
      "let pool = &ctx.accounts.pool;",
      "let price = pool.sqrt_price;",
      "swap_exact_in(pool, amount,",
      "  min_out)?;",
    ],
  },
];

export function LearningTracks() {
  return (
    <section className="relative py-28">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-float-2" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Learning tracks
            </h2>
            <p className="mt-2 text-muted-foreground">
              Structured paths from fundamentals to advanced DeFi.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/courses">
              View all
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {tracks.map((track) => (
            <Link key={track.name} href="/courses" className="group">
              <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm p-0 gap-0 overflow-hidden transition-all hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5">
                {/* Code preview header */}
                <div className="relative h-40 overflow-hidden border-b border-border/50 bg-[#0c0c0e] px-5 pt-4">
                  {/* Faint accent glow */}
                  <div
                    className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-[60px] opacity-30"
                    style={{ background: track.accent }}
                  />
                  {/* Code lines */}
                  <div className="font-mono text-[11px] leading-[1.7] text-muted-foreground/40">
                    {track.preview.map((line, i) => (
                      <div key={i} className="truncate">
                        <span className="mr-3 inline-block w-3 text-right text-[10px] text-muted-foreground/20">
                          {i + 1}
                        </span>
                        {line}
                      </div>
                    ))}
                  </div>
                  {/* Icon badge */}
                  <div
                    className="absolute bottom-3 left-5 flex size-10 items-center justify-center rounded-lg border font-mono text-xs font-bold"
                    style={{
                      borderColor: `${track.accent}40`,
                      color: track.accent,
                      background: `${track.accent}10`,
                    }}
                  >
                    <track.icon className="size-5" />
                  </div>
                  {/* Fade to card */}
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-card/80 to-transparent" />
                </div>

                {/* Card body */}
                <CardHeader className="p-5 pb-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: track.accent }}
                    >
                      {track.category}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {track.tag}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg tracking-tight">
                    {track.name}
                  </CardTitle>
                  <CardDescription className="leading-relaxed text-sm">
                    {track.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-4">
                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>
                        {track.completed}/{track.lessons} lessons
                      </span>
                      <div className="flex items-center gap-1">
                        <Flame className="size-3 text-xp" />
                        <span>{track.lessons * 100} XP</span>
                      </div>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-border/50">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width:
                            track.completed > 0
                              ? `${(track.completed / track.lessons) * 100}%`
                              : "0%",
                          background: track.accent,
                        }}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div
                    className="inline-flex items-center gap-1.5 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: track.accent }}
                  >
                    Start course <ArrowRight className="size-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/courses">
              View all courses <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
