import type { Metadata, Viewport } from 'next';
import { AnalyticsProvider } from './providers/AnalyticsProvider';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#1b231d',
};

export const metadata: Metadata = {
  title: 'Superteam Academy',
  description: 'Learn Solana development with on-chain credentials and earn XP',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/favicon_io/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Superteam Academy',
    description: 'Learn Solana development with on-chain credentials and earn XP',
    siteName: 'Superteam Academy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Superteam Academy',
    description: 'Learn Solana development with on-chain credentials and earn XP',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to PostHog CDN */}
        <link rel="dns-prefetch" href="https://us-assets.i.posthog.com" />
        <link rel="preconnect" href="https://us-assets.i.posthog.com" crossOrigin="anonymous" />

        {/* Blocking theme script — runs before paint to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else if (saved === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.add('light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
