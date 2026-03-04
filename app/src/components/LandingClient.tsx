"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion"
import { useRef, useState, useEffect } from "react"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe,
  GraduationCap,
  Layers,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react"
import { useI18n } from "@/components/providers/LocaleProvider"


const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)" },
}

const mkStagger = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})


function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [display, setDisplay] = useState("0")
  const numeric = parseInt(value.replace(/\D/g, ""), 10)
  const isSymbol = isNaN(numeric)

  useEffect(() => {
    if (!isInView) return
    if (isSymbol) { setDisplay(value); return }
    const duration = 1200
    const step = (ts: number, t0: number) => {
      const p = Math.min((ts - t0) / duration, 1)
      setDisplay(Math.floor((1 - Math.pow(1 - p, 3)) * numeric).toString())
      if (p < 1) requestAnimationFrame((ts2) => step(ts2, t0))
    }
    requestAnimationFrame((ts) => step(ts, ts))
  }, [isInView, numeric, isSymbol, value])

  return (
    <span ref={ref}>
      {isSymbol ? value : display}
      {!isSymbol && value.includes("+") ? "+" : ""}
    </span>
  )
}


function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const reduce = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={!reduce && inView ? "show" : reduce ? "show" : "hidden"}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}


function StaggerGrid({ children, className = "grid gap-4 sm:grid-cols-3" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const reduce = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={mkStagger(0.07)}
      initial="hidden"
      animate={!reduce && inView ? "show" : reduce ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  )
}


function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={`rounded-2xl border border-border bg-card p-7 ${className}`}
      variants={fadeUp}
      whileHover={reduce ? {} : {
        y: -5,
        borderColor: "hsl(var(--primary) / 0.4)",
        boxShadow: "0 12px 40px -10px hsl(var(--primary) / 0.18)",
        transition: { duration: 0.18 },
      }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}


function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
      {children}
    </div>
  )
}


function SectionH2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-extrabold tracking-tight text-foreground"
      style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
    >
      {children}
    </h2>
  )
}


function AnimatedHr() {
  const reduce = useReducedMotion()
  return (
    <motion.hr
      className="border-border"
      initial={reduce ? {} : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: "left" }}
    />
  )
}


export default function HomePageClient({
  totalLearners,
  totalCourses,
}: {
  totalLearners: number
  totalCourses: number
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      
      <section
        id="hero"
        className="relative overflow-hidden px-4 pt-16 pb-12 sm:pt-24 sm:pb-20"
      >

        
        <div className="pointer-events-none absolute inset-0">
          
          <div className="absolute left-1/2 -top-40 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />

          <motion.div
            className="absolute right-[-8rem] top-10 hidden h-[24rem] w-[24rem] rounded-full bg-primary/10 blur-3xl sm:block"
            style={{ willChange: "transform" }}
            animate={reduce ? {} : { y: [0, 18, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute left-[-10rem] bottom-[-8rem] hidden h-[28rem] w-[28rem] rounded-full bg-primary/8 blur-3xl sm:block"
            style={{ willChange: "transform" }}
            animate={reduce ? {} : { y: [0, -16, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right,rgba(128,128,128,0.2) 1px,transparent 1px),linear-gradient(to bottom,rgba(128,128,128,0.2) 1px,transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage: "radial-gradient(60% 50% at 50% 20%,black 0%,transparent 70%)",
              WebkitMaskImage: "radial-gradient(60% 50% at 50% 20%,black 0%,transparent 70%)",
            }}
          />
          
          <div
            className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        
        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            
            <motion.div variants={mkStagger(0.08, 0.05)} initial={false} animate="show">

              
              <motion.div
                variants={fadeUp}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
              >
                <motion.span
                  animate={reduce ? {} : { rotate: [0, 15, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.span>
                {t("landingPage.hero.badge", "DeFi learning + on-chain credentials")}
              </motion.div>

              <motion.h1
                className="font-extrabold tracking-tight"
                style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)", lineHeight: 1.05, letterSpacing: "-0.03em" }}
                variants={mkStagger(0.07, 0.1)}
              >
                
                <span className="flex items-baseline gap-[0.2em] whitespace-nowrap">
                  <span className="overflow-hidden">
                    <motion.span className="inline-block text-foreground/20"
                      variants={{ hidden: { y: "105%" }, show: { y: 0 } }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                      {t("landingPage.hero.titleLine1Lead", "Master")}
                    </motion.span>
                  </span>
                  <span className="overflow-hidden">
                    <motion.span className="inline-block text-foreground"
                      variants={{ hidden: { y: "105%" }, show: { y: 0 } }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                      {t("landingPage.hero.titleLine1Accent", "Web3")}
                    </motion.span>
                  </span>
                </span>
                
                <span className="flex items-baseline gap-[0.2em] whitespace-nowrap">
                  <span className="overflow-hidden">
                    <motion.span className="inline-block text-foreground/20"
                      variants={{ hidden: { y: "105%" }, show: { y: 0 } }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                      {t("landingPage.hero.titleLine2Lead", "step by")}
                    </motion.span>
                  </span>
                  <span className="overflow-hidden">
                    <motion.span className="inline-block text-primary"
                      variants={{ hidden: { y: "105%" }, show: { y: 0 } }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                      {t("landingPage.hero.titleLine2Accent", "step.")}
                    </motion.span>
                  </span>
                </span>
              </motion.h1>

              
              <motion.p
                variants={fadeUp}
                className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {t(
                  "landingPage.hero.description",
                  "Learn Solana by shipping real projects. Enroll with your wallet, earn Token-2022 XP, track level progression, and unlock soulbound credentials that prove your progress on-chain."
                )}
              </motion.p>

              
              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/sign-up">
                  <motion.div whileHover={reduce ? {} : { scale: 1.03 }} whileTap={reduce ? {} : { scale: 0.97 }}>
                    <Button size="lg" className="h-12 px-8 text-base font-semibold">
                      {t("landing.hero.cta", "Start Learning Free")}
                      <motion.span
                        className="ml-2 inline-flex"
                        animate={reduce ? {} : { x: [0, 4, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.5 }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.span>
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/courses">
                  <motion.div whileHover={reduce ? {} : { scale: 1.03 }} whileTap={reduce ? {} : { scale: 0.97 }}>
                    <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                      <Play className="mr-2 h-4 w-4" />
                      {t("landing.hero.exploreCourses", "Explore Courses")}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              
            </motion.div>

            
            <div className="relative">
              
              <motion.div
                aria-hidden
                className="absolute -top-8 left-6 hidden h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/80 shadow-md backdrop-blur sm:flex"
                initial={reduce ? {} : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <ShieldCheck className="h-6 w-6 text-primary" />
              </motion.div>
              <motion.div
                aria-hidden
                className="absolute -bottom-4 right-8 hidden h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/80 shadow-md backdrop-blur sm:flex"
                initial={reduce ? {} : { opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Trophy className="h-6 w-6 text-primary" />
              </motion.div>

              
              <motion.div
                className="relative mx-auto w-full max-w-[500px]"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              >
                <motion.div
                  className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl"
                  style={{ willChange: "transform" }}
                  animate={reduce ? {} : { y: [0, -10, 0] }}
                  transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  
                  <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {[0,1,2].map(i => (
                        <span key={i} className="h-2.5 w-2.5 rounded-full bg-muted" />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">Web3 Learning Dashboard</span>
                    <div className="h-5 w-14 rounded-full bg-muted/60" />
                  </div>

                  
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground">
                          {t("landingPage.hero.panel.activeTrack", "Active track")}
                        </div>
                        <div className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                          {t("landingPage.hero.panel.path", "Builder Path")}
                          <span className="text-primary">.</span>
                        </div>
                        <div className="mt-1.5 max-w-[220px] text-sm text-muted-foreground">
                          {t(
                            "landingPage.hero.panel.description",
                            "Wallet-signed enrollment. Token-2022 XP. Soulbound credential."
                          )}
                        </div>
                      </div>
                      <div className="hidden shrink-0 rounded-xl border border-border bg-muted/40 px-3 py-2 text-center sm:block">
                        <div className="text-xs text-muted-foreground">
                          {t("landingPage.hero.panel.streak", "Streak")}
                        </div>
                        <div className="text-lg font-extrabold text-foreground">7 🔥</div>
                      </div>
                    </div>

                    
                    <div className="mt-5 grid gap-3">
                      {[
                        { label: t("landingPage.hero.panel.walletEnrollment", "Wallet Enrollment"), pct: 100 },
                        { label: t("landingPage.hero.panel.xpProgress", "XP Progress (Token-2022)"), pct: 64 },
                        { label: t("landingPage.hero.panel.credentialReadiness", "Credential Readiness"), pct: 38 },
                      ].map((row, i) => (
                        <motion.div
                          key={row.label}
                          className="rounded-xl border border-border bg-background/60 p-4 backdrop-blur"
                          initial={reduce ? {} : { opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{row.label}</span>
                            <span className="text-muted-foreground">{row.pct}%</span>
                          </div>
                          <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted">
                            <motion.div
                              className="h-1.5 rounded-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${row.pct}%` }}
                              transition={{ duration: 1.0, ease: "easeOut", delay: 0.5 + i * 0.15 }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
                    <motion.div
                      className="absolute inset-y-0 w-1/3 skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/8 to-transparent"
                      style={{ willChange: "transform" }}
                      animate={reduce ? {} : { x: ["-100%", "400%"] }}
                      transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>

                
                <motion.div
                  className="absolute -left-8 top-16 hidden w-52 rounded-2xl border border-border bg-card/85 p-4 shadow-xl backdrop-blur md:block"
                  initial={reduce ? {} : { opacity: 0, x: -24, y: 8 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  style={reduce ? {} : { y: 0 }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {t("landingPage.hero.floating.credential", "Credential unlocked")}
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {t("landingPage.hero.floating.credentialDesc", "Metaplex Core NFT, verifiable on Solana.")}
                  </div>
                </motion.div>

                
                <motion.div
                  className="absolute -right-8 bottom-14 hidden w-52 rounded-2xl border border-border bg-card/85 p-4 shadow-xl backdrop-blur md:block"
                  initial={reduce ? {} : { opacity: 0, x: 24, y: -8 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {t("landingPage.hero.floating.xpMilestone", "XP milestone")}
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {t("landingPage.hero.floating.xpDesc", "XP balance updates from your Token-2022 account.")}
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>


          <h2 className="sr-only">Platform highlights</h2>
          <StaggerGrid className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                title: t("landingPage.cards.projectFirst.title", "Project-first curriculum"),
                desc: t(
                  "landingPage.cards.projectFirst.desc",
                  "Learn by building practical Solana products, not passive tutorials."
                ),
              },
              {
                icon: Zap,
                title: t("landingPage.cards.xpProgression.title", "Token-2022 XP progression"),
                desc: t(
                  "landingPage.cards.xpProgression.desc",
                  "Your XP is a non-transferable Token-2022 balance tied to your wallet."
                ),
              },
              {
                icon: ShieldCheck,
                title: t("landingPage.cards.soulbound.title", "Soulbound credentials"),
                desc: t(
                  "landingPage.cards.soulbound.desc",
                  "Track-level credentials are verifiable and upgrade in-place on-chain."
                ),
              },
            ].map((item) => (
              <Card key={item.title}>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </StaggerGrid>
        </div>
      </section>

      <AnimatedHr />

      
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mb-14 max-w-xl">
          <Pill>{t("landingPage.howItWorks.pill", "How it works")}</Pill>
          <SectionH2>
            <span className="text-primary">{t("landingPage.howItWorks.titleHighlight", "Clear system.")}</span>{" "}
            {t("landingPage.howItWorks.titleRest", "Real progress.")}
          </SectionH2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {t(
              "landingPage.howItWorks.description",
              "Enroll with your wallet, complete lessons and challenges, and turn progress into verifiable proof."
            )}
          </p>
        </Reveal>

        <StaggerGrid>
          {[
            {
              step: "01",
              icon: BookOpen,
              title: t("landingPage.howItWorks.steps.one.title", "Connect and enroll"),
              desc: t(
                "landingPage.howItWorks.steps.one.desc",
                "Connect your wallet and sign enrollment directly on Devnet."
              ),
            },
            {
              step: "02",
              icon: Zap,
              title: t("landingPage.howItWorks.steps.two.title", "Earn on-chain XP"),
              desc: t(
                "landingPage.howItWorks.steps.two.desc",
                "XP is read from your Token-2022 account and converted into levels."
              ),
            },
            {
              step: "03",
              icon: ShieldCheck,
              title: t("landingPage.howItWorks.steps.three.title", "Verify credentials"),
              desc: t(
                "landingPage.howItWorks.steps.three.desc",
                "Unlock and verify soulbound Metaplex Core credentials by track."
              ),
            },
          ].map((s) => (
            <Card key={s.step}>
              <div className="mb-5 flex items-start justify-between">
                <motion.div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"
                  whileHover={reduce ? {} : { rotate: [0, -12, 12, 0], scale: 1.1 }}
                  transition={{ duration: 0.35 }}
                >
                  <s.icon className="h-5 w-5 text-primary" />
                </motion.div>
                <span className="font-mono text-xs font-bold tracking-widest text-primary">{s.step}</span>
              </div>
              <h3 className="text-base font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </StaggerGrid>
      </section>

      <AnimatedHr />

      
      <section id="tracks" className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mb-14 max-w-xl">
          <Pill>{t("landingPage.tracks.pill", "Who it's for")}</Pill>
          <SectionH2>
            {t("landingPage.tracks.titleLead", "Every Web3 role,")}{" "}
            <span className="text-primary">{t("landingPage.tracks.titleAccent", "one platform.")}</span>
          </SectionH2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {t(
              "landingPage.tracks.description",
              "Built for developers, researchers, creators, and operators who want measurable Web3 progress."
            )}
          </p>
        </Reveal>

        <StaggerGrid className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: t("landingPage.tracks.cards.builders.title", "Builders"),
              icon: Layers,
              desc: t("landingPage.tracks.cards.builders.desc", "Smart contracts, dApps, tooling, integrations."),
            },
            {
              title: t("landingPage.tracks.cards.defiResearch.title", "DeFi & Research"),
              icon: Target,
              desc: t("landingPage.tracks.cards.defiResearch.desc", "Protocols, token models, risk, strategy."),
            },
            {
              title: t("landingPage.tracks.cards.creators.title", "Creators & Marketing"),
              icon: Sparkles,
              desc: t("landingPage.tracks.cards.creators.desc", "Narratives, growth, campaigns, community."),
            },
            {
              title: t("landingPage.tracks.cards.designProduct.title", "Design & Product"),
              icon: CheckCircle2,
              desc: t("landingPage.tracks.cards.designProduct.desc", "UX, product thinking, systems, shipping."),
            },
            {
              title: t("landingPage.tracks.cards.governance.title", "Governance & DAOs"),
              icon: ShieldCheck,
              desc: t("landingPage.tracks.cards.governance.desc", "Ops, coordination, governance mechanics."),
            },
            {
              title: t("landingPage.tracks.cards.founders.title", "Founders"),
              icon: Trophy,
              desc: t("landingPage.tracks.cards.founders.desc", "From idea to launch: strategy, team, execution."),
            },
          ].map((c) => (
            <Card key={c.title} className="flex items-start gap-4 p-5">
              <motion.div
                className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                whileHover={reduce ? {} : { scale: 1.18, rotate: 6 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
              >
                <c.icon className="h-4 w-4 text-primary" />
              </motion.div>
              <div>
                <div className="text-sm font-bold text-foreground">{c.title}</div>
                <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.desc}</div>
              </div>
            </Card>
          ))}
        </StaggerGrid>
      </section>

      <AnimatedHr />

      
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mb-14 max-w-2xl">
          <Pill>{t("landingPage.platform.pill", "Platform")}</Pill>
          <SectionH2>
            {t("landingPage.platform.titleLead", "Everything you need to learn")}{" "}
            <span className="text-primary">{t("landingPage.platform.titleAccent", "Web3 properly.")}</span>
          </SectionH2>
        </Reveal>

        <StaggerGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: GraduationCap,
              title: t("landingPage.platform.cards.curriculum.title", "Structured curriculum"),
              desc: t(
                "landingPage.platform.cards.curriculum.desc",
                "Clear learning paths from fundamentals to advanced specializations."
              ),
            },
            {
              icon: Zap,
              title: t("landingPage.platform.cards.xpLevels.title", "On-chain XP + levels"),
              desc: t(
                "landingPage.platform.cards.xpLevels.desc",
                "Level is derived from XP with transparent progression mechanics."
              ),
            },
            {
              icon: Trophy,
              title: t("landingPage.platform.cards.challenges.title", "Challenge-driven learning"),
              desc: t(
                "landingPage.platform.cards.challenges.desc",
                "Interactive lessons and coding challenges reinforce mastery."
              ),
            },
            {
              icon: ShieldCheck,
              title: t("landingPage.platform.cards.verification.title", "Credential verification"),
              desc: t(
                "landingPage.platform.cards.verification.desc",
                "Inspect wallet-owned credentials and verify on explorer."
              ),
            },
            {
              icon: Users,
              title: t("landingPage.platform.cards.community.title", "Community-ready model"),
              desc: t(
                "landingPage.platform.cards.community.desc",
                "Designed for cohorts, communities, and open-source collaboration."
              ),
            },
            {
              icon: Globe,
              title: t("landingPage.platform.cards.latam.title", "LATAM-first accessibility"),
              desc: t(
                "landingPage.platform.cards.latam.desc",
                "Prepared for PT-BR, ES, and EN learning experiences."
              ),
            },
          ].map((f) => (
            <Card key={f.title}>
              <motion.div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"
                whileHover={reduce ? {} : { scale: 1.15, rotate: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
              >
                <f.icon className="h-5 w-5 text-primary" />
              </motion.div>
              <h3 className="text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </StaggerGrid>
      </section>

      
      <section className="mx-auto max-w-6xl px-4 pb-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-10 py-16 sm:px-16 sm:py-20">
            
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{ willChange: "opacity" }}
              animate={reduce ? {} : { opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute -top-28 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
            </motion.div>
            
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative">
              <motion.div
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary"
                initial={{ opacity: 0, scale: 0.88 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Zap className="h-3 w-3" />
                {t("landingPage.finalCta.badge", "Free to start. Built for real Solana builders.")}
              </motion.div>

              <motion.h2
                className="max-w-2xl font-extrabold tracking-tight text-foreground"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {t("landingPage.finalCta.titleLead", "Start your Web3 learning journey")}{" "}
                <span className="text-primary">{t("landingPage.finalCta.titleAccent", "today.")}</span>
              </motion.h2>

              <motion.p
                className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {t(
                  "landingPage.finalCta.description",
                  "Start with one track, prove skills on-chain, and build a developer profile that compounds."
                )}
              </motion.p>

              <motion.div
                className="mt-10 flex flex-wrap items-center gap-4"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link href="/sign-up">
                  <motion.div whileHover={reduce ? {} : { scale: 1.03 }} whileTap={reduce ? {} : { scale: 0.97 }}>
                    <Button size="lg" className="h-12 px-10 text-base font-semibold">
                      {t("landing.hero.cta", "Start Learning Free")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/courses">
                  <motion.div whileHover={reduce ? {} : { scale: 1.03 }} whileTap={reduce ? {} : { scale: 0.97 }}>
                    <Button variant="outline" size="lg" className="h-12 px-10 text-base">
                      {t("landingPage.finalCta.exploreTracks", "Explore Tracks")}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              <motion.div
                className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3"
                variants={mkStagger(0.09, 0.35)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                {[
                  t("landingPage.finalCta.points.noCard", "No credit card required"),
                  t("landingPage.finalCta.points.walletNative", "Wallet-native progression"),
                  t("landingPage.finalCta.points.verifiable", "Verifiable on-chain credentials"),
                ].map((txt) => (
                  <motion.div key={txt} className="flex items-center gap-2 text-sm text-muted-foreground" variants={fadeUp}>
                    <motion.span
                      initial={reduce ? {} : { scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.4 }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </motion.span>
                    {txt}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
