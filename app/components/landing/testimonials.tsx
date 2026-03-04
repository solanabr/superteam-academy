import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Alex Chen",
    role: "DeFi Developer",
    avatar: "AC",
    quote: "Superteam Academy took me from zero to deploying my first Solana program in just 2 weeks. The hands-on approach is incredible.",
  },
  {
    name: "Maria Santos",
    role: "Frontend Engineer",
    avatar: "MS",
    quote: "The on-chain credentials are game-changing. My credential NFT has already helped me land interviews at top Solana projects.",
  },
  {
    name: "Dev Kumar",
    role: "Full-Stack Developer",
    avatar: "DK",
    quote: "Best Web3 learning platform I've used. The XP system keeps you motivated, and the curriculum is top-notch.",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-border py-20 bg-muted/20">
      <div className="mx-auto max-w-6xl px-8">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            What Learners Say
          </h2>
          <p className="mt-2 text-muted-foreground">
            Join hundreds of developers building on Solana
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">"{t.quote}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
