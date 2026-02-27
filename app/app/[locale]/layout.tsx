import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import LazyWalletProvider from '../../components/LazyWalletProvider';
import AuthProviderWrapper from '../../components/AuthProviderWrapper';
import Analytics from '../../components/Analytics';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const META: Record<string, { title: string; description: string; ogDesc: string }> = {
  'pt-BR': {
    title: 'Superteam Academy — Aprenda Solana & Web3',
    description: 'A plataforma de aprendizado definitiva para desenvolvedores Web3 no Brasil. Aprenda, construa e ganhe credenciais on-chain.',
    ogDesc: 'Aprenda Solana & Web3 com credenciais on-chain.',
  },
  en: {
    title: 'Superteam Academy — Learn Solana & Web3',
    description: 'The ultimate learning platform for Web3 developers in Brazil. Learn, build, and earn on-chain credentials.',
    ogDesc: 'Learn Solana & Web3 with on-chain credentials.',
  },
  es: {
    title: 'Superteam Academy — Aprende Solana y Web3',
    description: 'La plataforma de aprendizaje definitiva para desarrolladores Web3 en Brasil. Aprende, construye y gana credenciales on-chain.',
    ogDesc: 'Aprende Solana y Web3 con credenciales on-chain.',
  },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app-roan-iota-58.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] ?? META['pt-BR'];
  return {
    title: m.title,
    description: m.description,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title: 'Superteam Academy',
      description: m.ogDesc,
      type: 'website',
      url: `${SITE_URL}/${locale}`,
      siteName: 'Superteam Academy',
      images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Superteam Academy' }],
      locale: locale === 'pt-BR' ? 'pt_BR' : locale === 'es' ? 'es_LA' : 'en_US',
    },
    twitter: {
      card: 'summary',
      title: m.title,
      description: m.ogDesc,
      images: ['/icon-512.png'],
    },
    manifest: '/manifest.json',
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ST Academy' },
    other: { 'mobile-web-app-capable': 'yes' },
  };
}

type Locale = (typeof routing.locales)[number];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="theme-color" content="#030712" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'Superteam Academy',
              url: 'https://app-roan-iota-58.vercel.app',
              description: 'Web3 and Solana education platform for Brazilian developers',
              sameAs: ['https://github.com/solanabr/superteam-academy'],
            }),
          }}
        />
        <link rel="dns-prefetch" href="https://api.devnet.solana.com" />
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-gray-950 text-gray-100 min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <AuthProviderWrapper>
              <LazyWalletProvider>
                <Analytics />
                <div className="flex flex-col min-h-screen">
                  <Nav />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </LazyWalletProvider>
            </AuthProviderWrapper>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
