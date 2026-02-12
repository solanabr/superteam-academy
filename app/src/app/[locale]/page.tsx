import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, Code, Sparkles, Trophy } from 'lucide-react';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });
  return { title: t('heroTitle'), description: t('heroSubtitle') };
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing');
  const tCommon = await getTranslations('common');

  const paths = [
    { name: 'Solana Fundamentals', desc: 'From zero to your first program', icon: Sparkles },
    { name: 'DeFi Developer', desc: 'Build lending, AMMs, and more', icon: Code },
    { name: 'Anchor & Programs', desc: 'Production-ready Solana programs', icon: BookOpen },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative border-b border-border/50 bg-gradient-to-b from-primary/5 via-background to-background px-4 py-20 sm:py-28 md:py-32">
        <div className="container relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t('heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/courses">
              <Button size="lg" className="h-12 rounded-xl px-8 text-base shadow-lg shadow-primary/25">
                {tCommon('exploreCourses')}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="h-12 rounded-xl border-2 px-8 text-base">
                {tCommon('signIn')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Learning paths */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">
          {t('learningPathPreview')}
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((item, i) => (
            <Link key={i} href="/courses">
              <article className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                  Start path →
                </span>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-muted/30 px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">
            {t('features')}
          </h2>
          <ul className="mt-10 space-y-4 text-muted-foreground">
            <li className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-4">
              <Code className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>Interactive coding challenges with integrated code editor</span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-4">
              <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>Gamified progression: XP, levels, streaks, achievements</span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>On-chain credentials (compressed NFTs) for course completion</span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-4">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>Multi-language: PT-BR, ES, EN</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 px-4 py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            Superteam Academy — Open-source LMS for Solana
          </span>
          <form className="flex w-full max-w-sm gap-2 sm:w-auto">
            <input
              type="email"
              placeholder={t('newsletterPlaceholder')}
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
            <Button type="submit" variant="secondary" className="rounded-lg">
              {t('subscribe')}
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
}
