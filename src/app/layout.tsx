import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import "../../node_modules/@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

function getSafeGaMeasurementId(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return /^G-[A-Z0-9]+$/i.test(trimmed) ? trimmed : null;
}

function getSafeClarityProjectId(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return /^[a-z0-9]+$/i.test(trimmed) ? trimmed : null;
}

async function getHtmlLang(): Promise<"en" | "pt-BR" | "es"> {
  const locale = (await cookies()).get("NEXT_LOCALE")?.value;
  if (locale === "pt-BR" || locale === "es" || locale === "en") {
    return locale;
  }
  return "en";
}

export const metadata: Metadata = {
  title: "Superteam Academy — Learn Solana, Earn On-Chain",
  description:
    "Decentralized learning platform on Solana. Complete lessons, earn soulbound XP, and collect credential NFTs.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const htmlLang = await getHtmlLang();
  const gaMeasurementId = getSafeGaMeasurementId(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  );
  const clarityProjectId = getSafeClarityProjectId(
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  );

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        {children}
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
          </>
        ) : null}
        {clarityProjectId ? (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityProjectId}");
            `}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
