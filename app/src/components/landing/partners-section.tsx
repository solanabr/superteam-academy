"use client";

export function PartnersSection() {
  const partners = [
    { name: "Solana", logo: "S" },
    { name: "Superteam", logo: "ST" },
    { name: "Metaplex", logo: "M" },
    { name: "Helius", logo: "H" },
    { name: "Anchor", logo: "A" },
  ];

  return (
    <section className="py-16 border-y border-border/50">
      <div className="container px-4">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by developers building on Solana
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                {partner.logo}
              </div>
              <span className="font-medium">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
