"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    id: 1,
    name: "Rafael Costa",
    role: "DeFi Developer",
    avatar: "",
    content:
      "Superteam Academy completely changed how I approach Solana development. The interactive challenges made complex concepts click.",
  },
  {
    id: 2,
    name: "Isabella Mendes",
    role: "NFT Creator",
    avatar: "",
    content:
      "From zero Rust knowledge to deploying my first NFT collection in weeks. The on-chain credentials are a great way to showcase my skills.",
  },
  {
    id: 3,
    name: "Carlos Ferreira",
    role: "Blockchain Engineer",
    avatar: "",
    content:
      "The security track saved me from common vulnerabilities. Every Solana developer should go through this curriculum.",
  },
];

export function TestimonialsSection() {
  const t = useTranslations("landing.testimonials");

  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="bg-background">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">{testimonial.content}</p>
                <div className="mt-4 flex text-yellow-500">
                  {"★★★★★".split("").map((star, i) => (
                    <span key={i}>{star}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
