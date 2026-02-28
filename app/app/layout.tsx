import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { DM_Sans, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-dm-sans",
	display: "swap",
});

const bricolageGrotesque = Bricolage_Grotesque({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-bricolage",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-jb-mono",
	display: "swap",
});

export const metadata: Metadata = {
	title: {
		default: "Superteam Academy - Learn Solana Development",
		template: "%s | Superteam Academy",
	},
	description:
		"Master Solana development through interactive courses, earn on-chain credentials, and join a global community of Web3 builders.",
	metadataBase: new URL("https://academy.superteam.fun"),
	openGraph: {
		type: "website",
		siteName: "Superteam Academy",
		title: "Superteam Academy - Learn Solana Development",
		description:
			"Master Solana development through interactive courses, earn on-chain credentials, and join a global community of Web3 builders.",
	},
	twitter: {
		card: "summary_large_image",
		site: "@SuperteamAcademy",
	},
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon.ico" type="image/x-icon" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link rel="manifest" href="/manifest.json" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
			</head>
			<body
				className={`min-h-screen flex flex-col ${dmSans.variable} ${bricolageGrotesque.variable} ${jetbrainsMono.variable}`}
			>
				{children}
			</body>
		</html>
	);
}
