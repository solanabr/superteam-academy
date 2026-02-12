import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('settings');

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <div className="mt-10 space-y-6">
        {[
          { key: 'profile' as const, desc: 'Edit name, bio, avatar, social links.' },
          { key: 'account' as const, desc: 'Email, connected wallets, Google/GitHub.' },
          { key: 'preferences' as const, desc: 'Language, theme, notifications.' },
          { key: 'privacy' as const, desc: 'Profile visibility, data export.' },
        ].map(({ key, desc }) => (
          <section
            key={key}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="text-xl font-semibold">{t(key)}</h2>
            <p className="mt-1 text-muted-foreground">{desc}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
