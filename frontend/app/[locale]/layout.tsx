import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Providers from "../providers";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { serverAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { locales } from "@superteam-academy/i18n/config";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
	title: {
		default: "Superteam Academy - Learn Solana Development",
		template: "%s | Superteam Academy",
	},
	description:
		"Master Solana development through interactive courses, earn on-chain credentials, and join a global community of Web3 builders.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	themeColor: "#008c4c",
};

export function generateStaticParams() {
	return locales.map((locale) => ({ locale: locale.code }));
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	// Validate locale
	const isValidLocale = locales.some((l) => l.code === locale);
	if (!isValidLocale) {
		notFound();
	}

	// Set request locale for next-intl
	setRequestLocale(locale);

	const headerList = await headers();
	const messages = await getMessages({ locale });
	const initialSession = await serverAuth.api.getSession({
		headers: {
			cookie: headerList.get("cookie") || "",
		},
	});

	return (
		<>
			{GA_ID && (
				<>
					<Script
						src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
						strategy="afterInteractive"
					/>
					<Script id="ga4-init" strategy="afterInteractive">
						{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
					</Script>
				</>
			)}
			<NextIntlClientProvider locale={locale} messages={messages}>
				<Providers
					initialSession={
						initialSession
							? {
									id: initialSession.session.id,
									expiresAt: initialSession
										? new Date(initialSession.session.expiresAt)
										: new Date(),
									userId: initialSession?.user.id ?? "",
								}
							: null
					}
				>
					<SiteHeader />
					<main className="flex-1">{children}</main>
					<SiteFooter />
				</Providers>
			</NextIntlClientProvider>
		</>
	);
}
