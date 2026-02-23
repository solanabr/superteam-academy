// app/src/components/landing/features-section.tsx
import { Terminal, Shield, Award, Users } from "lucide-react";

const features = [
  {
    icon: Terminal,
    title: "Interactive Coding",
    description: "Write, test, and deploy Solana programs directly in your browser with our Monaco-based editor."
  },
  {
    icon: Award,
    title: "On-Chain Credentials",
    description: "Earn Soulbound NFTs (Metaplex Core) that prove your skills. Your CV lives on the blockchain."
  },
  {
    icon: Shield,
    title: "Gamified Progress",
    description: "Level up, maintain streaks, and climb the leaderboard. Learning shouldn't be boring."
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Open source curriculum built by the Superteam Brazil community for the world."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Why Superteam Academy?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
                We combine the best of Web2 education with Web3 incentives.
            </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6 rounded-xl border bg-background hover:border-purple-500/50 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                        <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}