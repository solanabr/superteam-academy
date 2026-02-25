import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import WalletProviderWrapper from '../../components/WalletProviderWrapper';
import '@solana/wallet-adapter-react-ui/styles.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Superteam Academy — Aprenda Solana & Web3',
  description:
    'A plataforma de aprendizado definitiva para desenvolvedores Web3 no Brasil. Aprenda, construa e ganhe credenciais on-chain.',
  openGraph: {
    title: 'Superteam Academy',
    description: 'Aprenda Solana & Web3 com credenciais on-chain.',
    type: 'website',
  },
};

type Locale = (typeof routing.locales)[number];

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
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-100 min-h-screen`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <WalletProviderWrapper>
              <div className="flex flex-col min-h-screen">
                <Nav />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </WalletProviderWrapper>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
