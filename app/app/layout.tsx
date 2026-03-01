import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "700"],
	variable: "--font-dm-sans",
	display: "swap",
});

const bricolageGrotesque = Bricolage_Grotesque({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-display",
	display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const t = await getTranslations({ locale, namespace: "seo.pages.home" });
	const title = t("title");
	const description = t("description");

	return {
		title: {
			default: title,
			template: "%s | Superteam Academy",
		},
		description,
		metadataBase: new URL("https://academy.superteam.fun"),
		openGraph: {
			type: "website",
			siteName: "Superteam Academy",
			title,
			description,
		},
		twitter: {
			card: "summary_large_image",
			site: "@SuperteamAcademy",
		},
	};
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon.ico" type="image/x-icon" />
				<link rel="manifest" href="/manifest.json" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
			</head>
			<body
				className={`min-h-screen flex flex-col ${dmSans.variable} ${bricolageGrotesque.variable}`}
			>
				{children}
			</body>
		</html>
	);
}
