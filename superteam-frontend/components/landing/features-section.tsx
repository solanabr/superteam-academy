import { Code2, Trophy, Shield, Zap, Award, Users } from "lucide-react"

const features = [
  {
    icon: Code2,
    title: "Interactive Code Editor",
    description:
      "Write, run, and test Solana programs directly in your browser with our split-pane editor and real-time feedback.",
  },
  {
    icon: Trophy,
    title: "Gamified Learning",
    description:
      "Earn XP, maintain streaks, climb the leaderboard, and collect achievement badges as you progress.",
  },
  {
    icon: Award,
    title: "On-Chain Credentials",
    description:
      "Receive NFT certificates on Solana that evolve as you complete tracks. Verifiable proof of your skills.",
  },
  {
    icon: Shield,
    title: "Security First",
    description:
      "Learn to identify and prevent common smart contract vulnerabilities with hands-on auditing challenges.",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description:
      "Run test cases against your code instantly. See pass/fail results and detailed error messages in real-time.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Join a thriving community of blockchain developers. Share solutions, ask questions, and collaborate.",
  },
]

export function FeaturesSection() {
  return (
    <section className="border-t border-border bg-card/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground lg:text-4xl text-balance">
            Everything You Need to Succeed
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-pretty">
            A complete learning platform designed for blockchain developers, from beginners to security auditors.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
