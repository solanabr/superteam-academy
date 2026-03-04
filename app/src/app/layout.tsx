import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import { DEFAULT_LOCALE, isAppLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Superteam Brazil Academy",
  description: "The ultimate learning platform for Solana-native developers. Build, learn, and earn on-chain credentials.",
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("locale")?.value
  const localeWasExplicitlySet = cookieStore.get("locale_set")?.value === "1"
  const initialLocale =
    localeWasExplicitlySet && isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body className="antialiased">
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        {CLARITY_ID && (
          <Script id="microsoft-clarity" strategy="lazyOnload">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
            `}
          </Script>
        )}
        <Providers initialLocale={initialLocale}>
          {children}
          <Toaster richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
