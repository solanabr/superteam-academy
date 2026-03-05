import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { ProvidersErrorBoundary } from "@/components/providers-error-boundary";
import { MountedOnly } from "@/components/mounted-only";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

// Initialize Sentry as early as possible (side-effect import)
import "@/lib/sentry";

const archivo = Archivo({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Superteam Academy | Aprenda Solana",
    template: "%s | Superteam Academy",
  },
  description:
    "Plataforma de ensino para desenvolvedores Solana: cursos interativos, credenciais on-chain e gamificação.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://superteam-academy.vercel.app",
  ),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ST Academy",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Superteam Academy",
    title: "Superteam Academy | Aprenda Solana",
    description:
      "Cursos interativos, credenciais on-chain e gamificação para desenvolvedores Solana.",
    locale: "pt_BR",
    alternateLocale: ["en_US", "es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy",
    description: "Plataforma de ensino para desenvolvedores Solana.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7eacb" },
    { media: "(prefers-color-scheme: dark)", color: "#1b231d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body
        className={`${archivo.variable} ${jetbrainsMono.variable} font-sans antialiased hero-cream hero-pattern text-foreground min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <MountedOnly>
            <ProvidersErrorBoundary>
              <AuthProvider>
                <PWARegister />
                {children}
              </AuthProvider>
            </ProvidersErrorBoundary>
          </MountedOnly>
        </ThemeProvider>
      </body>
    </html>
  );
}
