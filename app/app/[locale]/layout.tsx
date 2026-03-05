import type { Metadata } from "next";
import { Funnel_Display, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { EnrollmentProvider } from "@/lib/enrollment-context";
import { BrandProvider } from "@/components/providers/brand-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@/components/analytics";
import { ErrorBoundary } from "@/components/error-boundary";
import { routing } from "@/i18n/routing";
import "../globals.css";

const funnelDisplay = Funnel_Display({
    subsets: ["latin", "latin-ext"],
    variable: "--font-heading",
    display: "swap",
    weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
    subsets: ["latin", "latin-ext"],
    variable: "--font-body",
    display: "swap",
});

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
    title: "Superteam Academy | Master Solana Development",
    description:
        "The most interactive, community-driven learning platform for Solana developers. Earn on-chain credentials, level up your skills, and build decentralized applications.",
    keywords: [
        "Solana",
        "blockchain",
        "developer education",
        "Web3",
        "smart contracts",
        "on-chain credentials",
        "Superteam",
        "learn Solana",
    ],
    authors: [{ name: "Superteam Academy" }],
    openGraph: {
        type: "website",
        locale: "en_US",
        siteName: "Superteam Academy",
        title: "Superteam Academy | Master Solana Development",
        description:
            "The most interactive learning platform for Solana developers. Earn on-chain credentials and build the future.",
    },
    twitter: {
        card: "summary_large_image",
        title: "Superteam Academy | Master Solana Development",
        description:
            "The most interactive learning platform for Solana developers. Earn on-chain credentials and build the future.",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default async function LocaleLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body
                className={`${funnelDisplay.variable} ${inter.variable} font-sans antialiased pattern-bg`}
            >
                {/* Inline script to prevent brand flash on refresh */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var b=localStorage.getItem("app-brand");if(b==="solana"||b==="brazil"){document.documentElement.setAttribute("data-brand",b)}else{document.documentElement.setAttribute("data-brand","brazil")}}catch(e){}})();`,
                    }}
                />
                <Analytics />
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange={false}
                >
                    <BrandProvider defaultBrand="brazil">
                        <NextIntlClientProvider messages={messages}>
                            <SessionProvider>
                                <WalletProvider>
                                    <AuthProvider>
                                        <EnrollmentProvider>
                                            <TooltipProvider>
                                                <ErrorBoundary>
                                                    {children}
                                                </ErrorBoundary>
                                            </TooltipProvider>
                                        </EnrollmentProvider>
                                    </AuthProvider>
                                </WalletProvider>
                            </SessionProvider>
                        </NextIntlClientProvider>
                    </BrandProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
