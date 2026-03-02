import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  BookOpen,
  Code2,
  Trophy,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 gradient-bg opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-superteam-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-superteam-green/20 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <Sparkles className="h-4 w-4 text-superteam-purple" />
              {t("badge")}
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              {t("heroTitle")}{" "}
              <span className="gradient-text">{t("heroHighlight")}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("heroDescription")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="courses"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-lg bg-gradient-to-r from-superteam-purple to-superteam-blue text-white font-semibold hover:opacity-90 transition-opacity"
              >
                {t("exploreCourses")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="dashboard"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-lg border border-border hover:bg-accent transition-colors font-semibold"
              >
                {t("connectWallet")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/40 bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: t("statsLearners") },
              { value: "25+", label: t("statsCourses") },
              { value: "1M+", label: t("statsXpMinted") },
              { value: "100+", label: t("statsCredentials") },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("howItWorksTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("howItWorksDescription")}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Users,
                step: "01",
                title: t("step1Title"),
                desc: t("step1Description"),
              },
              {
                icon: BookOpen,
                step: "02",
                title: t("step2Title"),
                desc: t("step2Description"),
              },
              {
                icon: Code2,
                step: "03",
                title: t("step3Title"),
                desc: t("step3Description"),
              },
              {
                icon: Trophy,
                step: "04",
                title: t("step4Title"),
                desc: t("step4Description"),
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 group-hover:glow-purple transition-all">
                  <item.icon className="h-7 w-7" />
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-2">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("featuresTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("featuresDescription")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Zap,
                title: t("feature1Title"),
                desc: t("feature1Description"),
                color: "text-superteam-green",
              },
              {
                icon: Shield,
                title: t("feature2Title"),
                desc: t("feature2Description"),
                color: "text-superteam-purple",
              },
              {
                icon: Trophy,
                title: t("feature3Title"),
                desc: t("feature3Description"),
                color: "text-superteam-blue",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border/40 bg-card p-6 hover:border-primary/40 transition-colors"
              >
                <feature.icon className={`h-8 w-8 ${feature.color} mb-4`} />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center rounded-2xl gradient-border p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("ctaTitle")}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {t("ctaDescription")}
            </p>
            <Link
              href="courses"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-lg bg-gradient-to-r from-superteam-purple to-superteam-green text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {t("ctaButton")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
