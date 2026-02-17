import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { testimonials } from "@/lib/mock-data";
import { Quote } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground lg:text-4xl text-balance">
            Loved by Developers
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-pretty">
            Hear from developers who transformed their careers through our
            platform.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/20"
            >
              <Quote className="h-5 w-5 text-primary/40 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {`"${t.text}"`}
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {t.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
